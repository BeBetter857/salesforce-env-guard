const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadBackground(extraChrome = {}) {
  const listeners = {
    runtime: { onMessage: { addListener() {} } },
    tabs: {
      onUpdated: { addListener() {} },
      onActivated: { addListener() {} },
    },
    action: { setBadgeText() {} },
    storage: { sync: { get(_key, cb) { if (cb) cb({}); }, set() {} } },
    cookies: { get() {}, getAll() {} },
    scripting: { executeScript() {} },
  };
  const chrome = merge(listeners, extraChrome);
  const context = {
    chrome,
    console,
    importScripts() {},
    setTimeout,
    URL,
    self: {},
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
  vm.runInContext(source, context);
  return context;
}

function loadI18n(navigator) {
  const context = {
    navigator,
    Intl,
    module: { exports: {} },
    exports: {},
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
  vm.runInContext(source, context);
  return context.module.exports;
}

function merge(base, extra) {
  for (const [key, value] of Object.entries(extra)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      base[key] = merge(base[key] || {}, value);
    } else {
      base[key] = value;
    }
  }
  return base;
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

test('matches normalized Salesforce host exactly, not by substring', () => {
  const { matchRule } = loadBackground();
  const rules = [{
    id: 'r1',
    pattern: 'abc.my.salesforce.com',
    environmentType: 'production',
    color: '#ef4444',
    enabled: true,
  }];

  assert.strictEqual(matchRule('https://abc.lightning.force.com/lightning/setup', rules)?.id, 'r1');
  assert.strictEqual(matchRule('https://xabc.my.salesforce.com/lightning/setup', rules), null);
  assert.strictEqual(
    matchRule('https://other.my.salesforce.com/lightning?retURL=https://abc.my.salesforce.com', rules),
    null
  );
});

test('matches URL path rules as normalized prefix boundaries', () => {
  const { matchRule } = loadBackground();
  const rules = [{
    id: 'setup',
    pattern: 'https://abc.my.salesforce.com/lightning/setup',
    environmentType: 'production',
    color: '#ef4444',
    enabled: true,
  }];

  assert.strictEqual(matchRule('https://abc.lightning.force.com/lightning/setup/SetupOneHome/home', rules)?.id, 'setup');
  assert.strictEqual(matchRule('https://abc.my.salesforce.com/lightning/page?next=/lightning/setup', rules), null);
});

test('waits for Salesforce cookie-domain lookup before falling back', async () => {
  const chrome = {
    cookies: {
      get(options, callback) {
        assert.strictEqual(options.name, 'sid');
        callback({ value: '00Dxx0000000001!current' });
      },
      getAll(options, callback) {
        const cookiesByDomain = {
          'salesforce.com': [{ value: '00Dxx0000000001!real', domain: 'abc.my.salesforce.com' }],
          'force.com': [{ value: '00Dxx0000000001!site', domain: 'abc.force.com' }],
        };
        const delay = options.domain === 'salesforce.com' ? 350 : 5;
        setTimeout(() => callback(cookiesByDomain[options.domain] || []), delay);
      },
    },
  };
  const { getSfHost } = loadBackground({ cookies: chrome.cookies });

  const host = await getSfHost('https://abc.force.com/s/some-page');

  assert.strictEqual(host, 'abc.my.salesforce.com');
});

test('popup maps bearer API source to a friendly label', () => {
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  assert.match(popupSource, /bearer:\s*['"]Bearer Token['"]/);
});

test('popup exposes import and export controls for rules', () => {
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');

  assert.match(popupHtml, /id="exportRulesBtn"/);
  assert.match(popupHtml, /id="importRulesInput"/);
  assert.match(popupSource, /function exportRules/);
  assert.match(popupSource, /function importRulesFromFile/);
});

test('popup exposes searchable rule list controls', () => {
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const i18nSource = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');

  assert.match(popupHtml, /id="ruleSearchInput"/);
  assert.match(popupSource, /function initRuleSearch/);
  assert.match(popupSource, /function filterRules/);
  assert.match(popupSource, /ruleSearchQuery/);
  assert.match(i18nSource, /ruleSearchPlaceholder/);
  assert.match(i18nSource, /emptySearchTitle/);
});

test('i18n supports Japanese for every popup string', () => {
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const { I18N_STRINGS, setLang, t } = require('../i18n.js');
  const missing = Object.entries(I18N_STRINGS)
    .filter(([, value]) => !value.ja)
    .map(([key]) => key);

  assert.deepStrictEqual(missing, []);
  assert.match(popupHtml, /<option value="ja">日本語<\/option>/);

  setLang('ja');
  assert.strictEqual(t('tabRules'), 'ルール');
  assert.strictEqual(t('btnSaveRule'), 'ルールを保存');
});

test('settings theme options are localized for Japanese', () => {
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const { setLang, t } = require('../i18n.js');

  assert.match(popupHtml, /data-i18n="themeLight"/);
  assert.match(popupHtml, /data-i18n="themeDark"/);

  setLang('ja');
  assert.strictEqual(t('themeLight'), '☀️ ライト');
  assert.strictEqual(t('themeDark'), '🌙 ダーク');
  assert.match(t('settingsLangDesc'), /日本語/);

  setLang('zh');
  assert.match(t('settingsLangDesc'), /日本語/);

  setLang('en');
  assert.match(t('settingsLangDesc'), /Japanese/);
});

test('default language is selected from user region before language', () => {
  assert.strictEqual(loadI18n({ languages: ['en-JP'], language: 'en-JP' }).detectDefaultLang(), 'ja');
  assert.strictEqual(loadI18n({ languages: ['en-CN'], language: 'en-CN' }).detectDefaultLang(), 'zh');
  assert.strictEqual(loadI18n({ languages: ['zh-US'], language: 'zh-US' }).detectDefaultLang(), 'en');
  assert.strictEqual(loadI18n({ languages: ['fr-FR'], language: 'fr-FR' }).detectDefaultLang(), 'en');
  assert.strictEqual(loadI18n({ languages: ['ja'], language: 'ja' }).detectDefaultLang(), 'ja');
});

test('popup rule actions use semantic icons instead of ambiguous text glyphs', () => {
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');

  assert.match(popupSource, /function iconSvg/);
  assert.match(popupSource, /iconSvg\('chevron-down'\)/);
  assert.match(popupSource, /iconSvg\(rule\.enabled \? 'pause' : 'play'\)/);
  assert.match(popupSource, /iconSvg\('edit'\)/);
  assert.match(popupSource, /iconSvg\('trash'\)/);
  assert.doesNotMatch(popupSource, /[◉○✎✕▾▸]/);
});

test('popup marks pending auto-discovered rules and clears the mark when enabled', () => {
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const i18nSource = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');

  assert.match(popupSource, /auto-rule-chip/);
  assert.match(popupHtml, /\.auto-rule-chip/);
  assert.match(i18nSource, /autoDetected/);
  assert.match(popupSource, /autoDetected:\s*enabled\s*\?\s*false\s*:\s*r\.autoDetected/);
  assert.doesNotMatch(popupSource, /enable-auto-rule-btn/);
});

test('popup keeps footer lightweight instead of reserving fixed list space', () => {
  const popupHtml = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const contentCss = popupHtml.match(/\.content\s*\{([^}]*)\}/)?.[1] || '';

  assert.doesNotMatch(popupHtml, /\.footer\s*\{[\s\S]*?position:\s*absolute/);
  assert.doesNotMatch(contentCss, /padding-bottom:\s*28px/);
  assert.doesNotMatch(popupHtml, /min-height:\s*300px/);
  assert.doesNotMatch(contentCss, /flex:\s*1\s*;/);
});

test('background silently saves disabled auto-discovered rules during navigation', () => {
  const backgroundSource = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
  const onUpdatedBlock = backgroundSource.match(/chrome\.tabs\.onUpdated\.addListener\([\s\S]*?\n\}\);/)?.[0] || '';

  assert.match(onUpdatedBlock, /ensureRuleExistsForUrl/);
  assert.match(backgroundSource, /async function ensureRuleExistsForUrl/);
  assert.match(backgroundSource, /enabled:\s*false/);
  assert.match(backgroundSource, /autoDetected:\s*true/);
});

test('imported rules are merged with existing rules instead of replacing them', () => {
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');

  assert.match(popupSource, /function mergeImportedRules/);
  assert.doesNotMatch(popupSource, /rules\s*=\s*imported\.map\(normalizeImportedRule\)\.filter\(Boolean\)/);
  assert.match(popupSource, /toastRulesImportedMerged/);
});

test('clearing rules requires user confirmation', () => {
  const popupSource = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  const resetHandler = popupSource.match(/resetDefaultBtn'\)\.addEventListener\('click', \(\) => \{[\s\S]*?\n  \}\);/)?.[0] || '';

  assert.match(resetHandler, /confirm\(/);
  assert.match(popupSource, /confirmClearRules/);
});

test('README documents the current popup and auto-discovery behavior', () => {
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');

  assert.match(readme, /后台静默发现/);
  assert.match(readme, /启用后会清除「自动发现」标记/);
  assert.match(readme, /规则搜索/);
  assert.match(readme, /导入 \/ 导出/);
});
