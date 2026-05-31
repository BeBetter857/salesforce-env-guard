// ── i18n 加载（兼容 importScripts 失败场景）──────────────────
// 注意：catch 块中不能使用 var I18N_STRINGS，因为 var 会被 hoist，
// 导致 i18n.js 中的 const I18N_STRINGS 声明冲突 → importScripts 永远失败。
try {
  importScripts('i18n.js');
} catch (_) {
  // importScripts 失败时，I18N_STRINGS 为 undefined，
  // 下方 t() 会使用内联回退表。
  console.warn('[Salesforce Env Guard] i18n.js importScripts failed, using inline fallback');
}
// 脚本加载后立即按 storage 中的语言初始化
try {
  chrome.storage.sync.get('lang', (data) => { setLang(data.lang || 'zh'); });
} catch (_) {}

// ── 内联回退翻译（关键 key，确保 importScripts 失败时核心功能可用）
var _I18N_FALLBACK = {
  urlLabelProduction:   { zh: '生产环境',                       en: 'Production' },
  urlLabelSandbox:      { zh: '沙盒环境',                       en: 'Sandbox' },
  urlLabelDeveloper:    { zh: '开发者环境',                     en: 'Developer' },
  urlLabelScratch:      { zh: 'Scratch Org',                  en: 'Scratch Org' },
  detectNotSF:          { zh: '当前页面不是 Salesforce',          en: 'Not a Salesforce page' },
  detectNoCookie:       { zh: '未检测到 Session Cookie',        en: 'No session cookie found' },
  detectNoSession:      { zh: '无法获取 Session',               en: 'Cannot obtain session' },
  detectApiFail:        { zh: 'API 查询失败，使用 URL 判断',      en: 'API query failed, using URL fallback' },
  detectApiExact:       { zh: 'API 精确检测',                   en: 'API exact detection' },
  detectUrlGuess:       { zh: 'URL 推测',                      en: 'URL guess' },
  detectUrlFallback:    { zh: 'URL 降级推测',                   en: 'URL fallback' },
  detectBtnRetry:       { zh: '重新检测',                       en: 'Re-detect' },
  envProduction:        { zh: '生产环境',                       en: 'Production' },
  envSandbox:           { zh: '沙盒环境',                       en: 'Sandbox' },
  envDevelopment:       { zh: '开发者环境',                     en: 'Developer Edition' },
  envScratch:           { zh: 'Scratch Org',                  en: 'Scratch Org' },
  envDeveloperEdition:  { zh: '开发者版',                       en: 'Developer Edition' },
};

function t(key, params) {
  // 确定翻译表：优先用 i18n.js 加载的，否则用内联回退
  var dict = (typeof I18N_STRINGS !== 'undefined' && I18N_STRINGS) ? I18N_STRINGS : _I18N_FALLBACK;
  var entry = dict[key];
  var lang = (typeof getLang === 'function') ? getLang() : 'zh';
  var str = entry ? (entry[lang] || entry['zh']) : key;
  if (params) {
    for (var k in params) { str = str.replace('{' + k + '}', params[k]); }
  }
  return str;
}
function setLang(l) {
  // 同步更新 i18n.js 的 _langState（如果可用）
  if (typeof _langState !== 'undefined') { _langState.current = l; }
  if (typeof self !== 'undefined') self.__sfBorderGuardLang = l;
}

// background.js — Service Worker
// 架构参考 SF Inspector Reloaded:
//   - Cookie 操作必须在 background 里完成（foreground 无 cookie API 权限）
//   - 用 orgId 前缀跨域匹配 sid cookie（格式：{orgId}!{token}）
//   - 所有消息通过单一 onMessage listener 处理，避免多个 listener 互相干扰

// ─────────────────────────────────────────────────────────────
// 默认规则（空，由用户自行添加）
// ─────────────────────────────────────────────────────────────

const DEFAULT_RULES = [];

// ─────────────────────────────────────────────────────────────
// 存储工具
// ─────────────────────────────────────────────────────────────

async function getRules() {
  const data = await chrome.storage.sync.get("orgRules");
  if (!data.orgRules) {
    await chrome.storage.sync.set({ orgRules: DEFAULT_RULES });
    return DEFAULT_RULES;
  }
  return data.orgRules;
}

async function saveRules(rules) {
  await chrome.storage.sync.set({ orgRules: rules });
}

async function getSettings() {
  const data = await chrome.storage.sync.get("settings");
  return data.settings || { borderWidth: 4, showLabel: true };
}

// ─────────────────────────────────────────────────────────────
// URL / 域名工具
// ─────────────────────────────────────────────────────────────

/**
 * 规范化 Salesforce 域名（参考 SF Inspector getMyDomain）
 * *.lightning.force.com  → *.my.salesforce.com  （Lightning URL 下 Authorization 会被重定向丢弃）
 * *.force.com.mcas.ms    → *.force.com          （剥掉 Microsoft Defender for Cloud Apps 后缀）
 * *.salesforce-setup.com → *.salesforce.com     （Setup 界面专用域）
 * *.setup.sfcrmproducts.cn → *.my.sfcrmproducts.cn （Salesforce 中国 Setup 域）
 * *.lightning.sfcrmapps.cn → *.my.sfcrmproducts.cn （Salesforce 中国 Lightning 域）
 */
function normalizeHost(hostname) {
  hostname = String(hostname || "").trim().toLowerCase().replace(/^\./, "");
  if (hostname.endsWith(".lightning.force.com"))
    return hostname.replace(".lightning.force.com", ".my.salesforce.com");
  if (hostname.endsWith(".force.com.mcas.ms"))
    return hostname.replace(".force.com.mcas.ms", ".force.com");
  if (hostname.endsWith(".salesforce-setup.com"))
    return hostname.replace(".salesforce-setup.com", ".salesforce.com");
  if (hostname.endsWith(".setup.sfcrmproducts.cn"))
    return hostname.replace(".setup.sfcrmproducts.cn", ".my.sfcrmproducts.cn");
  if (hostname.endsWith(".lightning.sfcrmapps.cn"))
    return hostname.replace(".lightning.sfcrmapps.cn", ".my.sfcrmproducts.cn");
  return hostname;
}

/** 精确 URL 规则判断（不模糊匹配） */
function detectEnvByUrl(hostname) {
  const h = normalizeHost(hostname);
  if (h === "login.salesforce.com")             return { type: "production", label: t('urlLabelProduction') };
  if (h === "test.salesforce.com")              return { type: "sandbox",    label: t('urlLabelSandbox') };
  if (h.endsWith(".scratch.my.salesforce.com")) return { type: "custom",     label: "Scratch Org" };
  if (h.endsWith(".sandbox.my.salesforce.com")) return { type: "sandbox",    label: t('urlLabelSandbox') };
  if (h.endsWith(".sandbox.my.sfcrmproducts.cn")) return { type: "sandbox",  label: t('urlLabelSandbox') };
  if (h.endsWith(".develop.my.salesforce.com")) return { type: "development", label: t('urlLabelDeveloper') };
  if (h.endsWith(".my.salesforce.com"))         return { type: "production", label: t('urlLabelProduction') };
  if (h.endsWith(".my.sfcrmproducts.cn"))        return { type: "production", label: t('urlLabelProduction') };
  if (h.endsWith(".cloudforce.com"))            return { type: "production", label: t('urlLabelProduction') };
  if (h.endsWith(".force.com"))                 return { type: "production", label: t('urlLabelProduction') };
  if (h.endsWith(".salesforce.com"))            return { type: "production", label: t('urlLabelProduction') };
  if (h.endsWith(".sfcrmproducts.cn"))           return { type: "production", label: t('urlLabelProduction') };
  if (h.endsWith(".sfcrmapps.cn"))               return { type: "production", label: t('urlLabelProduction') };
  return null;
}

function isSalesforceUrl(url) {
  try {
    const h = new URL(url).hostname;
    return h.endsWith("salesforce.com") || h.endsWith("force.com")
      || h.endsWith("cloudforce.com")   || h.endsWith("salesforce-setup.com")
      || h.endsWith("force.com.mcas.ms") || h.endsWith("sfcrmproducts.cn")
      || h.endsWith("sfcrmapps.cn");
  } catch { return false; }
}

function getAutoCreatableEnv(url) {
  try {
    const hostname = new URL(url).hostname;
    const normalizedHost = normalizeHost(hostname);
    const env = detectEnvByUrl(hostname);
    if (!env) return null;

    const isOrgEnvironment =
      normalizedHost.endsWith(".my.salesforce.com") ||
      normalizedHost.endsWith(".sandbox.my.salesforce.com") ||
      normalizedHost.endsWith(".develop.my.salesforce.com") ||
      normalizedHost.endsWith(".scratch.my.salesforce.com") ||
      normalizedHost.endsWith(".my.sfcrmproducts.cn") ||
      normalizedHost.endsWith(".sandbox.my.sfcrmproducts.cn");

    return isOrgEnvironment ? { env, normalizedHost } : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 规则匹配：最长 pattern 优先
// ─────────────────────────────────────────────────────────────

function matchRule(url, rules) {
  if (!url) return null;
  const candidates = buildUrlMatchCandidates(url);
  const enabled = rules.filter(r => r.enabled);
  const matched = enabled.filter(r =>
    candidates.some(candidate => candidate.includes(normalizeRulePattern(r.pattern)))
  );
  if (!matched.length) return null;
  matched.sort((a, b) => normalizeRulePattern(b.pattern).length - normalizeRulePattern(a.pattern).length);
  return matched[0];
}

function hasMatchingRule(url, rules) {
  if (!url) return false;
  const candidates = buildUrlMatchCandidates(url);
  return rules.some(r =>
    candidates.some(candidate => candidate.includes(normalizeRulePattern(r.pattern)))
  );
}

function buildUrlMatchCandidates(url) {
  const candidates = [String(url).toLowerCase()];
  try {
    const parsed = new URL(url);
    const normalizedHost = normalizeHost(parsed.hostname);
    candidates.push(parsed.hostname.toLowerCase(), normalizedHost);
    if (normalizedHost !== parsed.hostname) {
      parsed.hostname = normalizedHost;
      candidates.push(parsed.href.toLowerCase());
    }
  } catch {}
  return [...new Set(candidates)];
}

function normalizeRulePattern(pattern) {
  const raw = String(pattern || "").trim().toLowerCase();
  if (!raw) return raw;

  try {
    const parsed = new URL(raw.includes("://") ? raw : "https://" + raw);
    const normalizedHost = normalizeHost(parsed.hostname);
    return raw.includes("://") || raw.includes("/")
      ? raw.replace(parsed.hostname, normalizedHost)
      : normalizedHost;
  } catch {
    return normalizeHost(raw);
  }
}

function extractOrgNameFromHost(normalizedHost) {
  // 从规范化域名中提取 Org 标识名
  // company.my.salesforce.com          → company
  // test--uat.sandbox.my.salesforce.com → test--uat
  // company.my.sfcrmproducts.cn         → company
  var h = String(normalizedHost || "");
  // 按优先级匹配后缀并剥离
  var suffixes = [
    ".sandbox.my.salesforce.com",
    ".develop.my.salesforce.com",
    ".scratch.my.salesforce.com",
    ".my.salesforce.com",
    ".sandbox.my.sfcrmproducts.cn",
    ".my.sfcrmproducts.cn",
  ];
  for (var i = 0; i < suffixes.length; i++) {
    if (h.endsWith(suffixes[i])) {
      return h.slice(0, -suffixes[i].length);
    }
  }
  // 兜底：直接返回域名本身
  return h;
}

function buildAutoRuleFromUrl(url) {
  try {
    const result = getAutoCreatableEnv(url);
    if (!result) return null;
    const { env, normalizedHost } = result;

    const colors = {
      production: "#ef4444",
      sandbox: "#f59e0b",
      development: "#22c55e",
      custom: "#3b82f6"
    };

    return {
      id: "rule_auto_" + Date.now(),
      pattern: normalizedHost,
      environmentType: env.type,
      color: colors[env.type] || colors.custom,
      label: extractOrgNameFromHost(normalizedHost),
      enabled: false,
      autoDetected: true
    };
  } catch {
    return null;
  }
}

function getMatchedRule(url, rules) {
  return matchRule(url, rules);
}

async function ensureRuleExistsForUrl(url, rules, tabId) {
  if (!getAutoCreatableEnv(url) || hasMatchingRule(url, rules)) return rules;

  const autoRule = buildAutoRuleFromUrl(url);
  if (!autoRule) return rules;

  // 立即保存规则（用 URL 标签），不阻塞边框推送
  const nextRules = [...rules, autoRule];
  await saveRules(nextRules);

  // 异步获取 Org 名称并更新规则标签（不阻塞返回）
  enrichRuleLabel(autoRule.id, url, tabId);

  return nextRules;
}

/** 后台异步获取 Org 名称，更新自动创建规则的标签 */
async function enrichRuleLabel(ruleId, url, tabId) {
  try {
    const sfHost = await getSfHost(url);
    if (!sfHost) return;
    const session = await getSession(sfHost);
    const sessionKey = session?.key;
    if (!sessionKey) return;
    const instanceUrl = `https://${sfHost}`;
    const orgInfo = await queryOrgInfo(tabId, instanceUrl, sessionKey);
    if (!orgInfo?.record?.Name) return;

    // 更新 storage 中的规则标签
    const data = await chrome.storage.sync.get("orgRules");
    const rules = data.orgRules || [];
    const idx = rules.findIndex(r => r.id === ruleId);
    if (idx >= 0) {
      rules[idx] = { ...rules[idx], label: orgInfo.record.Name };
      await chrome.storage.sync.set({ orgRules: rules });
    }
  } catch {
    // 静默失败——URL 标签已足够
  }
}

// ─────────────────────────────────────────────────────────────
// Cookie Session 获取（参考 SF Inspector background.js 原始实现）
//
// SF Inspector 的两步流程：
//   Step 1: getSfHost  — 从当前域读 sid，取出 orgId，跨域找对应 salesforce.com cookie
//   Step 2: getSession — 用找到的 sfHost 读最终 session cookie
//
// 核心发现：
//   - sid cookie 格式：{orgId}!{sessionToken}
//   - visual.force.com 的 session 没有 API 权限，要用 salesforce.com 域的 session
//   - 搜索顺序：salesforce.com > cloudforce.com > salesforce.mil > cloudforce.mil > sfcrmproducts.cn > force.com
// ─────────────────────────────────────────────────────────────

const SF_COOKIE_DOMAINS = [
  "salesforce.com",
  "cloudforce.com",
  "salesforce.mil",
  "cloudforce.mil",
  "sfcrmproducts.cn",
  "sfcrmapps.cn",
  "force.com"
];

/**
 * Step 1: 从 tabUrl 读 sid，提取 orgId，在各 SF 域找匹配的 session cookie domain
 * 返回 sfHost（如 "xxx.my.salesforce.com"）或 null
 */
function getSfHost(tabUrl, cookieStoreId) {
  return new Promise(resolve => {
    const currentDomain = new URL(tabUrl).hostname;

    // MCAS 域下无法读 sid，直接返回当前域
    if (currentDomain.endsWith(".mcas.ms")) {
      resolve(normalizeHost(currentDomain));
      return;
    }

    chrome.cookies.get(
      { url: tabUrl, name: "sid", storeId: cookieStoreId },
      cookie => {
        if (!cookie) { resolve(null); return; }

        const orgId = cookie.value.split("!")[0];
        let resolved = false;

        SF_COOKIE_DOMAINS.forEach(domain => {
          chrome.cookies.getAll(
            { name: "sid", domain, secure: true, storeId: cookieStoreId },
            cookies => {
              if (resolved) return;
              // 找到 orgId 匹配的 cookie（排除 help.salesforce.com）
              const match = cookies.find(c =>
                c.value.startsWith(orgId + "!") && c.domain !== "help.salesforce.com"
              );
              if (match) {
                resolved = true;
                resolve(match.domain);
              }
            }
          );
        });

        // 300ms 后还没找到就用当前域
        setTimeout(() => {
          if (!resolved) resolve(normalizeHost(currentDomain));
        }, 300);
      }
    );
  });
}

/**
 * Step 2: 用 sfHost 获取最终 session（key = cookie 值，hostname = cookie domain）
 */
function getSession(sfHost, cookieStoreId) {
  return new Promise(resolve => {
    chrome.cookies.get(
      { url: "https://" + sfHost, name: "sid", storeId: cookieStoreId },
      sessionCookie => {
        if (!sessionCookie) { resolve(null); return; }
        resolve({ key: sessionCookie.value, hostname: sessionCookie.domain });
      }
    );
  });
}

// ─────────────────────────────────────────────────────────────
// Org API 查询（通过 executeScript 在页面同域发起 fetch）
// 参考 SF Inspector 的做法：用页面上下文 + credentials:include 绕过跨域
// ─────────────────────────────────────────────────────────────

async function queryOrgInfo(tabId, instanceUrl, sessionKey) {
  // 优先：页面同域 fetch（最可靠，绕过 CORS）
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: async (instanceUrl) => {
        const q = "SELECT+Id,Name,OrganizationType,IsSandbox+FROM+Organization+LIMIT+1";
        const res = await fetch(`${instanceUrl}/services/data/v59.0/query?q=${q}`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => [{}]);
          throw new Error(err[0]?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.records?.[0] ?? null;
      },
      args: [instanceUrl]
    });
    const record = results?.[0]?.result;
    if (record) return { record, method: "page_fetch" };
  } catch (e) {
    console.warn("[Salesforce Env Guard] page_fetch failed:", e.message);
  }

  // 降级：Bearer token（用 background 拿到的 session key）
  if (sessionKey) {
    try {
      const q = encodeURIComponent("SELECT Id, Name, OrganizationType, IsSandbox FROM Organization LIMIT 1");
      const res = await fetch(`${instanceUrl}/services/data/v59.0/query?q=${q}`, {
        headers: { "Authorization": `Bearer ${sessionKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        const record = data.records?.[0];
        if (record) return { record, method: "bearer" };
      }
    } catch (e) {
      console.warn("[Salesforce Env Guard] bearer failed:", e.message);
    }
  }

  return null;
}

function maskToken(token) {
  if (!token || token.length < 16) return "***";
  return token.slice(0, 8) + "..." + token.slice(-6);
}

// ─────────────────────────────────────────────────────────────
// 主检测流程
// ─────────────────────────────────────────────────────────────

async function detectSalesforceEnv(tab) {
  const tabUrl = tab.url;
  const tabId  = tab.id;

  try {
    const hostname = new URL(tabUrl).hostname;
    const urlEnv   = detectEnvByUrl(hostname);

    if (!urlEnv) {
      return { success: false, error: t('detectNotSF') };
    }

    // Step 1: 获取正确的 sfHost（SF Inspector 的跨域 orgId 匹配）
    const cookieStoreId = tab.cookieStoreId; // Firefox incognito 支持；Chrome 下为 undefined
    const sfHost = await getSfHost(tabUrl, cookieStoreId);

    if (!sfHost) {
      return {
        success: true, source: "url",
        sessionId: null, instanceUrl: `https://${normalizeHost(hostname)}`,
        urlEnv, orgInfo: null,
        warning: t('detectNoCookie')
      };
    }

    const instanceUrl = `https://${sfHost}`;

    // Step 2: 获取 session
    const session = await getSession(sfHost, cookieStoreId);

    if (!session) {
      // 也尝试 localStorage（SF Inspector 存的 OAuth token）
      let oauthToken = null;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: "MAIN",
          func: (key) => localStorage.getItem(key),
          args: [`${sfHost}_access_token`]
        });
        oauthToken = results?.[0]?.result || null;
      } catch {}

      if (!oauthToken) {
        return {
          success: true, source: "url",
          sessionId: null, instanceUrl,
          urlEnv, orgInfo: null,
          warning: t('detectNoSession')
        };
      }

      // 用 OAuth token 查询
      const orgResult = await queryOrgInfo(tabId, instanceUrl, oauthToken);
      if (!orgResult) {
        return {
          success: true, source: "url_fallback",
          sessionId: maskToken(oauthToken), tokenSource: "oauth_cache",
          instanceUrl, urlEnv, orgInfo: null,
          warning: t('detectApiFail')
        };
      }
      return buildSuccessResult(orgResult, instanceUrl, urlEnv, oauthToken, "oauth_cache");
    }

    // 有 session cookie，查询 Org 信息
    const orgResult = await queryOrgInfo(tabId, instanceUrl, session.key);

    if (!orgResult) {
      return {
        success: true, source: "url_fallback",
        sessionId: maskToken(session.key), tokenSource: "cookie_sid",
        instanceUrl, urlEnv, orgInfo: null,
        warning: t('detectApiFail')
      };
    }

    return buildSuccessResult(orgResult, instanceUrl, urlEnv, session.key, "cookie_sid");

  } catch (e) {
    return { success: false, error: e.message };
  }
}

function buildSuccessResult(orgResult, instanceUrl, urlEnv, sessionKey, tokenSource) {
  const { record, method } = orgResult;
  return {
    success: true,
    source: "api",
    apiSource: method,
    sessionId: maskToken(sessionKey),
    tokenSource,
    instanceUrl,
    urlEnv,
    orgInfo: {
      orgId:     record.Id,
      orgName:   record.Name,
      orgType:   record.OrganizationType,
      isSandbox: record.IsSandbox
    }
  };
}

// ─────────────────────────────────────────────────────────────
// 边框推送
// ─────────────────────────────────────────────────────────────

async function pushToTab(tabId, url) {
  try {
    let [rules, settings] = await Promise.all([getRules(), getSettings()]);
    const matched = getMatchedRule(url, rules);

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    }).catch(() => {});

    await chrome.tabs.sendMessage(tabId, {
      type: "SF_BORDER_UPDATE",
      rule: matched,
      settings
    });
  } catch { /* tab 关闭或不支持 content script */ }
}

async function updateIcon(tabId) {
  await chrome.action.setBadgeText({ tabId, text: "" });
}

async function refreshAllSFTabs() {
  const tabs = await chrome.tabs.query({});
  const updates = [];
  for (const tab of tabs) {
    if (tab.url && isSalesforceUrl(tab.url)) {
      updates.push(pushToTab(tab.id, tab.url));
      updates.push(updateIcon(tab.id));
    }
  }
  await Promise.all(updates);
}

// ─────────────────────────────────────────────────────────────
// Tab 事件监听
// ─────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // 仅在用户主动导航到新 Org 时自动创建规则
    try {
      let rules = await getRules();
      rules = await ensureRuleExistsForUrl(tab.url, rules, tabId);
    } catch { /* 静默失败，不影响边框推送 */ }
    await pushToTab(tabId, tab.url);
    updateIcon(tabId);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  updateIcon(tabId);
});

// ─────────────────────────────────────────────────────────────
// 单一 Message Listener（所有 case 统一处理，避免多 listener 冲突）
// ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(e => {
    sendResponse({ success: false, error: e.message });
  });
  return true; // 保持异步通道（SF Inspector 的做法）
});

async function handleMessage(message, sender) {
  switch (message.type) {

    case "GET_RULES":
      return { rules: await getRules() };

    case "SAVE_RULES":
      await saveRules(message.rules);
      await refreshAllSFTabs();
      return { ok: true };

    case "GET_SETTINGS":
      return { settings: await getSettings() };

    case "SAVE_SETTINGS":
      await chrome.storage.sync.set({ settings: message.settings });
      await refreshAllSFTabs();
      return { ok: true };

    case "GET_CURRENT_TAB_MATCH": {
      const tab = sender.tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
      if (!tab?.url) return { rule: null };
      const rules = await getRules();
      return { rule: getMatchedRule(tab.url, rules), url: tab.url };
    }

    case "MATCH_URL_RULES": {
      // 用传入的 rules 直接匹配，不读 storage（用于本地即时更新）
      const rule = getMatchedRule(message.url, message.rules);
      return { rule, url: message.url };
    }

    case "DETECT_SF_ENV": {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.url) return { success: false, error: t('detectNotSF') };
      return await detectSalesforceEnv(tab);
    }

    case "SET_LANG": {
      setLang(message.lang);
      return { ok: true };
    }

    default:
      return { error: "unknown message type: " + message.type };
  }
}
