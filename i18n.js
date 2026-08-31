// i18n.js — 中英日国际化

const I18N_STRINGS = {
  // ── 通用 ──────────────────────────────
  appName:              { zh: 'Salesforce Env Guard',          en: 'Salesforce Env Guard', ja: 'Salesforce Env Guard' },
  appSubtitle:          { zh: '环境守卫',                       en: 'Env Guard', ja: '環境ガード' },

  // ── Tab 导航 ──────────────────────────
  tabRules:             { zh: '规则列表',                       en: 'Rules', ja: 'ルール' },
  tabAdd:               { zh: '添加规则',                       en: 'Add Rule', ja: 'ルール追加' },
  tabSettings:          { zh: '设置',                          en: 'Settings', ja: '設定' },
  tabDetect:            { zh: '检测',                          en: 'Detect', ja: '検出' },

  // ── 当前环境栏 ────────────────────────
  noMatch:              { zh: '⊘ 当前页面无匹配规则',            en: '⊘ No matching rule for current page', ja: '⊘ 現在のページに一致するルールはありません' },

  // ── 规则列表 ──────────────────────────
  emptyTitle:           { zh: '暂无规则',                       en: 'No Rules Yet', ja: 'ルールはまだありません' },
  emptyDesc:            { zh: '点击「添加规则」创建第一条规则',    en: 'Click "Add Rule" to create your first rule', ja: '「ルール追加」から最初のルールを作成します' },
  emptySearchTitle:     { zh: '没有匹配规则',                   en: 'No Matching Rules', ja: '一致するルールがありません' },
  emptySearchDesc:      { zh: '换个关键词试试',                 en: 'Try another keyword', ja: '別のキーワードを試してください' },
  ruleSearchPlaceholder:{ zh: '搜索规则、域名或环境',            en: 'Search rules, domains, or envs', ja: 'ルール、ドメイン、環境を検索' },
  ruleMatchTitle:       { zh: '实际匹配域名',                   en: 'Matched Domains', ja: '一致するドメイン' },
  dragHandleTitle:      { zh: '拖拽排序',                       en: 'Drag to reorder', ja: 'ドラッグして並べ替え' },
  btnExpand:            { zh: '展开',                          en: 'Expand', ja: '展開' },
  btnCollapse:          { zh: '收起',                          en: 'Collapse', ja: '折りたたむ' },
  btnEnable:            { zh: '启用',                          en: 'Enable', ja: '有効化' },
  btnDisable:           { zh: '禁用',                          en: 'Disable', ja: '無効化' },
  btnEdit:              { zh: '编辑',                          en: 'Edit', ja: '編集' },
  btnDelete:            { zh: '删除',                          en: 'Delete', ja: '削除' },
  autoDetected:         { zh: '自动发现',                       en: 'Auto', ja: '自動検出' },

  // ── 表单 ──────────────────────────────
  formTitleNew:         { zh: '新建规则',                       en: 'New Rule', ja: '新規ルール' },
  formTitleEdit:        { zh: '编辑规则',                       en: 'Edit Rule', ja: 'ルール編集' },
  labelDomain:          { zh: 'Domain',                        en: 'Domain', ja: 'Domain' },
  domainHint:           { zh: '（Org 的规范化域名）',            en: ' (normalized Org domain)', ja: '（Org の正規化ドメイン）' },
  domainPlaceholder:    { zh: '例：company.my.salesforce.com 或 test--uat.sandbox.my.sfcrmproducts.cn',
                              en: 'e.g. company.my.salesforce.com or test--uat.sandbox.my.sfcrmproducts.cn',
                              ja: '例：company.my.salesforce.com または test--uat.sandbox.my.sfcrmproducts.cn' },
  labelEnvType:         { zh: '环境类型',                       en: 'Environment Type', ja: '環境タイプ' },
  labelLabel:           { zh: 'Label',                        en: 'Label', ja: 'Label' },
  labelHint:            { zh: '（备注）',                       en: ' (note)', ja: '（メモ）' },
  labelPlaceholder:     { zh: '例：China Prod',                en: 'e.g. China Prod', ja: '例：Japan Prod' },
  labelColor:           { zh: '边框颜色',                       en: 'Border Color', ja: '枠線の色' },
  btnSaveRule:          { zh: '保存规则',                       en: 'Save Rule', ja: 'ルールを保存' },
  btnCancel:            { zh: '取消',                          en: 'Cancel', ja: 'キャンセル' },
  btnReset:             { zh: '重置',                          en: 'Reset', ja: 'リセット' },

  // ── 环境类型 ──────────────────────────
  envProduction:        { zh: '生产环境',                       en: 'Production', ja: '本番環境' },
  envSandbox:           { zh: '沙盒环境',                       en: 'Sandbox', ja: 'Sandbox 環境' },
  envDevelopment:       { zh: '开发者环境',                     en: 'Developer', ja: '開発環境' },
  envScratch:           { zh: 'Scratch Org',                  en: 'Scratch Org', ja: 'Scratch Org' },
  envDeveloperEdition:  { zh: '开发者版',                       en: 'Developer Edition', ja: 'Developer Edition' },
  envUAT:               { zh: 'UAT 环境',                      en: 'UAT', ja: 'UAT 環境' },
  envCustom:            { zh: '自定义',                        en: 'Custom', ja: 'カスタム' },
  envType_production:   { zh: '生产',                          en: 'Production', ja: '本番' },
  envType_sandbox:      { zh: '沙盒',                          en: 'Sandbox', ja: 'Sandbox' },
  envType_development:  { zh: '开发',                          en: 'Dev', ja: '開発' },
  envType_uat:          { zh: 'UAT',                          en: 'UAT', ja: 'UAT' },
  envType_custom:       { zh: '自定义',                        en: 'Custom', ja: 'カスタム' },

  // ── 设置 ──────────────────────────────
  settingsDisplay:      { zh: '显示设置',                       en: 'Display', ja: '表示' },
  settingsBorderWidth:  { zh: '边框宽度',                       en: 'Border Width', ja: '枠線の幅' },
  settingsBorderDesc:   { zh: '页面四周边框的粗细',              en: 'Thickness of the colored page border', ja: 'ページ周囲に表示する色付き枠線の太さ' },
  settingsShowLabel:    { zh: '显示顶部标签',                   en: 'Show Top Label', ja: '上部ラベルを表示' },
  settingsShowLabelDesc:{ zh: '页面顶部的环境名称标签',          en: 'Environment label at the top of page', ja: 'ページ上部に環境名ラベルを表示' },
  settingsTheme:        { zh: '主题模式',                       en: 'Theme', ja: 'テーマ' },
  settingsThemeDesc:    { zh: '深色 / 浅色界面切换',             en: 'Switch between dark and light mode', ja: 'ライト / ダーク表示を切り替え' },
  themeLight:           { zh: '☀️ 浅色',                       en: '☀️ Light', ja: '☀️ ライト' },
  themeDark:            { zh: '🌙 深色',                       en: '🌙 Dark', ja: '🌙 ダーク' },
  settingsData:         { zh: '数据管理',                       en: 'Data', ja: 'データ' },
  settingsClearRules:   { zh: '清空所有规则',                   en: 'Clear All Rules', ja: 'すべてのルールを削除' },
  settingsClearDesc:    { zh: '移除全部自定义规则',              en: 'Remove all custom rules', ja: 'すべてのカスタムルールを削除' },
  btnClear:             { zh: '清空',                          en: 'Clear', ja: '削除' },
  confirmClearRules:    { zh: '确定要清空所有规则吗？此操作无法撤销。', en: 'Clear all rules? This cannot be undone.', ja: 'すべてのルールを削除しますか？この操作は元に戻せません。' },
  settingsTransferRules:{ zh: '导入 / 导出规则',                 en: 'Import / Export Rules', ja: 'ルールのインポート / エクスポート' },
  settingsTransferDesc: { zh: '备份或迁移规则配置',              en: 'Back up or migrate rule settings', ja: 'ルール設定をバックアップまたは移行' },
  btnImport:            { zh: '导入',                          en: 'Import', ja: 'インポート' },
  btnExport:            { zh: '导出',                          en: 'Export', ja: 'エクスポート' },
  settingsLang:         { zh: '界面语言',                       en: 'Language', ja: '表示言語' },
  settingsLangDesc:     { zh: '切换中文 / English / 日本語',     en: 'Switch Chinese / English / Japanese', ja: '中国語 / English / 日本語を切り替え' },

  // ── 检测面板 ──────────────────────────
  detectIntroTitle:     { zh: '自动检测当前 Org 环境',          en: 'Auto-Detect Current Org', ja: '現在の Org 環境を自動検出' },
  detectIntroDesc:      { zh: '通过 Salesforce API 精确判断是否为生产环境，并可一键创建对应规则',
                              en: 'Query the Salesforce API to identify the current org and create a matching rule',
                              ja: 'Salesforce API で現在の Org を識別し、一致するルールを作成します' },
  detectBtnStart:       { zh: '开始检测',                       en: 'Start Detection', ja: '検出開始' },
  detectBtnRetry:       { zh: '重新检测',                       en: 'Re-detect', ja: '再検出' },
  detectDetecting:      { zh: '检测中...',                      en: 'Detecting...', ja: '検出中...' },
  detectFailed:         { zh: '检测失败',                       en: 'Detection Failed', ja: '検出に失敗しました' },
  detectApiExact:       { zh: 'API 精确',                       en: 'API Exact', ja: 'API 判定' },
  detectUrlGuess:       { zh: 'URL 判断',                       en: 'URL Guess', ja: 'URL 推定' },
  detectUrlFallback:    { zh: 'URL 备用',                       en: 'URL Fallback', ja: 'URL フォールバック' },
  detectOrgName:        { zh: 'Org 名称',                       en: 'Org Name', ja: 'Org 名' },
  detectOrgType:        { zh: 'Org 类型',                       en: 'Org Type', ja: 'Org タイプ' },
  detectOrgId:          { zh: 'Org ID',                        en: 'Org ID', ja: 'Org ID' },
  detectInstanceUrl:    { zh: '实例地址',                       en: 'Instance URL', ja: 'インスタンス URL' },
  detectIsSandbox:      { zh: 'IsSandbox',                     en: 'IsSandbox', ja: 'IsSandbox' },
  detectSession:        { zh: 'Session',                       en: 'Session', ja: 'Session' },
  detectApiMethod:      { zh: 'API 方式',                       en: 'API Method', ja: 'API 方式' },
  detectNonProd:        { zh: '非生产环境',                     en: 'Non-Production', ja: '非本番環境' },
  detectIsProd:         { zh: '生产环境',                       en: 'Production', ja: '本番環境' },
  detectCreateTitle:    { zh: '根据检测结果创建规则',            en: 'Create Rule from Detection', ja: '検出結果からルールを作成' },
  detectCreatePlaceholder:{ zh: '规则备注（例：China Production）', en: 'Rule label (e.g. China Production)', ja: 'ルールメモ（例：Japan Production）' },
  detectCreateBtn:      { zh: '＋ 创建规则',                    en: '+ Create Rule', ja: '+ ルールを作成' },

  // ── 检测结果消息 ──────────────────────
  detectNotSF:          { zh: '当前页面不是 Salesforce 环境',    en: 'Current page is not a Salesforce environment', ja: '現在のページは Salesforce 環境ではありません' },
  detectNoCookie:       { zh: '未检测到登录 Cookie，请确认已登录 Salesforce', en: 'No login cookie detected. Please sign in to Salesforce', ja: 'ログイン Cookie が見つかりません。Salesforce にログインしてください' },
  detectNoSession:      { zh: '未检测到 Session Cookie，结果仅供参考', en: 'No session cookie detected, results are approximate', ja: 'Session Cookie が見つかりません。結果は参考値です' },
  detectApiFail:        { zh: 'API 查询失败，使用 URL 判断',      en: 'API query failed, using URL-based detection', ja: 'API 問い合わせに失敗しました。URL で判定します' },
  detectPartial:        { zh: '结果可能不完整（访问受限组织）',    en: 'Results may be incomplete (restricted org)', ja: '結果が不完全な可能性があります（アクセス制限付き Org）' },

  // ── Toast ─────────────────────────────
  toastRuleSaved:       { zh: '规则已保存 ✓',                   en: 'Rule saved ✓', ja: 'ルールを保存しました ✓' },
  toastRuleDeleted:     { zh: '规则已删除',                      en: 'Rule deleted', ja: 'ルールを削除しました' },
  toastRulesCleared:    { zh: '已清空所有规则',                   en: 'All rules cleared', ja: 'すべてのルールを削除しました' },
  toastRuleCreated:     { zh: '规则已创建：{label} ✓',           en: 'Rule created: {label} ✓', ja: 'ルールを作成しました：{label} ✓' },
  toastRuleExists:      { zh: '该 Org 规则已存在',               en: 'Rule already exists for this Org', ja: 'この Org のルールはすでに存在します' },
  toastPatternEmpty:    { zh: 'Pattern 不能为空',               en: 'Domain pattern is required', ja: 'ドメインパターンは必須です' },
  toastDefaultRestored: { zh: '已恢复默认规则',                   en: 'Default rules restored', ja: 'デフォルトルールを復元しました' },
  toastRulesExported:   { zh: '规则已导出',                      en: 'Rules exported', ja: 'ルールをエクスポートしました' },
  toastRulesImportedMerged:{ zh: '已新增 {added} 条，跳过 {skipped} 条', en: 'Added {added}, skipped {skipped}', ja: '{added} 件追加、{skipped} 件スキップ' },
  toastImportFailed:    { zh: '导入失败：请选择有效 JSON 文件',    en: 'Import failed: choose a valid JSON file', ja: 'インポート失敗：有効な JSON ファイルを選択してください' },

  // ── URL 检测标签（background.js）─────
  urlLabelProduction:   { zh: '生产环境',                       en: 'Production', ja: '本番環境' },
  urlLabelSandbox:      { zh: '沙盒环境',                       en: 'Sandbox', ja: 'Sandbox 環境' },
  urlLabelDeveloper:    { zh: '开发者环境',                     en: 'Developer', ja: '開発環境' },
  urlLabelScratch:      { zh: 'Scratch Org',                  en: 'Scratch Org', ja: 'Scratch Org' },

  // ── 规则统计 ──────────────────────────
  rulesCount:           { zh: '{total} rules · {active} active', en: '{total} rules · {active} active', ja: '{total} 件 · 有効 {active} 件' },

  // ── Content ──────────────────────────
  contentEnv:           { zh: '环境',                          en: 'Env', ja: '環境' },
};

// ── 语言状态 ──────────────────────────────────
// 使用全局变量，兼容 popup (window) 和 service worker (self)
const _langState = { current: 'zh' };

/** 获取当前语言 */
function getLang() {
  return _langState.current;
}

/** 设置语言 */
function setLang(lang) {
  _langState.current = lang;
  // 同步到全局，方便跨上下文访问
  if (typeof window !== 'undefined') {
    window.__sfBorderGuardLang = lang;
  }
  if (typeof self !== 'undefined') {
    self.__sfBorderGuardLang = lang;
  }
}

/**
 * 翻译 key，支持 {param} 替换
 * 示例：t('toastRuleCreated', { label: 'My Org' })
 */
function t(key, params) {
  const lang = getLang();
  const entry = I18N_STRINGS[key];
  let str = entry ? (entry[lang] || entry['zh']) : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}

/** 根据浏览器 locale 的地区优先选择默认语言 */
function detectDefaultLang() {
  const navigatorLocales = getNavigatorLocales();
  const intlLocale = getIntlLocale();
  const navigatorRegion = navigatorLocales.map(getLocaleRegion).find(Boolean);
  const navigatorLanguage = navigatorLocales.map(getLocaleLanguage).find(Boolean);

  if (navigatorRegion === 'JP') return 'ja';
  if (navigatorRegion === 'CN') return 'zh';
  if (navigatorRegion === 'US') return 'en';
  if (navigatorRegion) return 'en';

  if (navigatorLanguage === 'zh') return 'zh';
  if (navigatorLanguage === 'ja') return 'ja';

  const intlRegion = getLocaleRegion(intlLocale);
  if (intlRegion === 'JP') return 'ja';
  if (intlRegion === 'CN') return 'zh';
  if (intlRegion === 'US') return 'en';
  if (intlRegion) return 'en';

  const intlLanguage = getLocaleLanguage(intlLocale);
  if (intlLanguage === 'zh') return 'zh';
  if (intlLanguage === 'ja') return 'ja';
  return 'en';
}

function getNavigatorLocales() {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const locales = [];

  if (Array.isArray(nav?.languages)) locales.push(...nav.languages);
  if (nav?.language) locales.push(nav.language);

  return [...new Set(locales.map(locale => String(locale || '').trim()).filter(Boolean))];
}

function getIntlLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || '';
  } catch {}
  return '';
}

function getLocaleLanguage(locale) {
  return String(locale || '').replace(/_/g, '-').split('-')[0].toLowerCase();
}

function getLocaleRegion(locale) {
  const parts = String(locale || '').replace(/_/g, '-').split('-');
  const region = parts.find((part, index) => index > 0 && /^[A-Za-z]{2}$|^\d{3}$/.test(part));
  return region ? region.toUpperCase() : '';
}

/** Service Worker 初始化：从 storage 读取语言设置 */
async function initWorkerLang() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const data = await chrome.storage.sync.get('lang');
      setLang(data.lang || detectDefaultLang());
    } catch {
      setLang(detectDefaultLang());
    }
  }
}

// CommonJS / ES module 兼容（如需）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { t, getLang, setLang, detectDefaultLang, I18N_STRINGS };
}
