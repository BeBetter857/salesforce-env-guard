// i18n.js — 中英文国际化

const I18N_STRINGS = {
  // ── 通用 ──────────────────────────────
  appName:              { zh: 'Salesforce Env Guard',          en: 'Salesforce Env Guard' },
  appSubtitle:          { zh: '环境守卫',                       en: 'Env Guard' },

  // ── Tab 导航 ──────────────────────────
  tabRules:             { zh: '规则列表',                       en: 'Rules' },
  tabAdd:               { zh: '添加规则',                       en: 'Add Rule' },
  tabSettings:          { zh: '设置',                          en: 'Settings' },
  tabDetect:            { zh: '检测',                          en: 'Detect' },

  // ── 当前环境栏 ────────────────────────
  noMatch:              { zh: '⊘ 当前页面无匹配规则',            en: '⊘ No matching rule for current page' },

  // ── 规则列表 ──────────────────────────
  emptyTitle:           { zh: '暂无规则',                       en: 'No Rules Yet' },
  emptyDesc:            { zh: '点击「添加规则」创建第一条规则',    en: 'Click "Add Rule" to create your first rule' },
  ruleMatchTitle:       { zh: '实际匹配域名',                   en: 'Matched Domains' },
  dragHandleTitle:      { zh: '拖拽排序',                       en: 'Drag to reorder' },
  btnExpand:            { zh: '展开',                          en: 'Expand' },
  btnCollapse:          { zh: '收起',                          en: 'Collapse' },
  btnEnable:            { zh: '启用',                          en: 'Enable' },
  btnDisable:           { zh: '禁用',                          en: 'Disable' },
  btnEdit:              { zh: '编辑',                          en: 'Edit' },
  btnDelete:            { zh: '删除',                          en: 'Delete' },

  // ── 表单 ──────────────────────────────
  formTitleNew:         { zh: '新建规则',                       en: 'New Rule' },
  formTitleEdit:        { zh: '编辑规则',                       en: 'Edit Rule' },
  labelDomain:          { zh: 'Domain',                        en: 'Domain' },
  domainHint:           { zh: '（Org 的规范化域名）',            en: ' (normalized Org domain)' },
  domainPlaceholder:    { zh: '例：company.my.salesforce.com 或 test--uat.sandbox.my.sfcrmproducts.cn',
                              en: 'e.g. company.my.salesforce.com or test--uat.sandbox.my.sfcrmproducts.cn' },
  labelEnvType:         { zh: '环境类型',                       en: 'Environment Type' },
  labelLabel:           { zh: 'Label',                        en: 'Label' },
  labelHint:            { zh: '（备注）',                       en: ' (note)' },
  labelPlaceholder:     { zh: '例：China Prod',                en: 'e.g. China Prod' },
  labelColor:           { zh: '边框颜色',                       en: 'Border Color' },
  btnSaveRule:          { zh: '保存规则',                       en: 'Save Rule' },
  btnCancel:            { zh: '取消',                          en: 'Cancel' },
  btnReset:             { zh: '重置',                          en: 'Reset' },

  // ── 环境类型 ──────────────────────────
  envProduction:        { zh: '生产环境',                       en: 'Production' },
  envSandbox:           { zh: '沙盒环境',                       en: 'Sandbox' },
  envDevelopment:       { zh: '开发者环境',                     en: 'Developer' },
  envScratch:           { zh: 'Scratch Org',                  en: 'Scratch Org' },
  envDeveloperEdition:  { zh: '开发者版',                       en: 'Developer Edition' },
  envUAT:               { zh: 'UAT 环境',                      en: 'UAT' },
  envCustom:            { zh: '自定义',                        en: 'Custom' },
  envType_production:   { zh: '生产',                          en: 'Production' },
  envType_sandbox:      { zh: '沙盒',                          en: 'Sandbox' },
  envType_development:  { zh: '开发',                          en: 'Dev' },
  envType_uat:          { zh: 'UAT',                          en: 'UAT' },
  envType_custom:       { zh: '自定义',                        en: 'Custom' },

  // ── 设置 ──────────────────────────────
  settingsDisplay:      { zh: '显示设置',                       en: 'Display' },
  settingsBorderWidth:  { zh: '边框宽度',                       en: 'Border Width' },
  settingsBorderDesc:   { zh: '页面四周边框的粗细',              en: 'Thickness of the colored page border' },
  settingsShowLabel:    { zh: '显示顶部标签',                   en: 'Show Top Label' },
  settingsShowLabelDesc:{ zh: '页面顶部的环境名称标签',          en: 'Environment label at the top of page' },
  settingsTheme:        { zh: '主题模式',                       en: 'Theme' },
  settingsThemeDesc:    { zh: '深色 / 浅色界面切换',             en: 'Switch between dark and light mode' },
  settingsData:         { zh: '数据管理',                       en: 'Data' },
  settingsClearRules:   { zh: '清空所有规则',                   en: 'Clear All Rules' },
  settingsClearDesc:    { zh: '移除全部自定义规则',              en: 'Remove all custom rules' },
  btnClear:             { zh: '清空',                          en: 'Clear' },
  settingsLang:         { zh: '界面语言',                       en: 'Language' },
  settingsLangDesc:     { zh: '切换中文 / English',             en: 'Switch language' },

  // ── 检测面板 ──────────────────────────
  detectIntroTitle:     { zh: '自动检测当前 Org 环境',          en: 'Auto-Detect Current Org' },
  detectIntroDesc:      { zh: '通过 Salesforce API 精确判断是否为生产环境，并可一键创建对应规则',
                              en: 'Query the Salesforce API to identify the current org and create a matching rule' },
  detectBtnStart:       { zh: '开始检测',                       en: 'Start Detection' },
  detectBtnRetry:       { zh: '重新检测',                       en: 'Re-detect' },
  detectDetecting:      { zh: '检测中...',                      en: 'Detecting...' },
  detectFailed:         { zh: '检测失败',                       en: 'Detection Failed' },
  detectApiExact:       { zh: 'API 精确',                       en: 'API Exact' },
  detectUrlGuess:       { zh: 'URL 判断',                       en: 'URL Guess' },
  detectUrlFallback:    { zh: 'URL 备用',                       en: 'URL Fallback' },
  detectOrgName:        { zh: 'Org 名称',                       en: 'Org Name' },
  detectOrgType:        { zh: 'Org 类型',                       en: 'Org Type' },
  detectOrgId:          { zh: 'Org ID',                        en: 'Org ID' },
  detectInstanceUrl:    { zh: '实例地址',                       en: 'Instance URL' },
  detectIsSandbox:      { zh: 'IsSandbox',                     en: 'IsSandbox' },
  detectSession:        { zh: 'Session',                       en: 'Session' },
  detectApiMethod:      { zh: 'API 方式',                       en: 'API Method' },
  detectNonProd:        { zh: '非生产环境',                     en: 'Non-Production' },
  detectIsProd:         { zh: '生产环境',                       en: 'Production' },
  detectCreateTitle:    { zh: '根据检测结果创建规则',            en: 'Create Rule from Detection' },
  detectCreatePlaceholder:{ zh: '规则备注（例：China Production）', en: 'Rule label (e.g. China Production)' },
  detectCreateBtn:      { zh: '＋ 创建规则',                    en: '+ Create Rule' },

  // ── 检测结果消息 ──────────────────────
  detectNotSF:          { zh: '当前页面不是 Salesforce 环境',    en: 'Current page is not a Salesforce environment' },
  detectNoCookie:       { zh: '未检测到登录 Cookie，请确认已登录 Salesforce', en: 'No login cookie detected. Please sign in to Salesforce' },
  detectNoSession:      { zh: '未检测到 Session Cookie，结果仅供参考', en: 'No session cookie detected, results are approximate' },
  detectApiFail:        { zh: 'API 查询失败，使用 URL 判断',      en: 'API query failed, using URL-based detection' },
  detectPartial:        { zh: '结果可能不完整（访问受限组织）',    en: 'Results may be incomplete (restricted org)' },

  // ── Toast ─────────────────────────────
  toastRuleSaved:       { zh: '规则已保存 ✓',                   en: 'Rule saved ✓' },
  toastRuleDeleted:     { zh: '规则已删除',                      en: 'Rule deleted' },
  toastRulesCleared:    { zh: '已清空所有规则',                   en: 'All rules cleared' },
  toastRuleCreated:     { zh: '规则已创建：{label} ✓',           en: 'Rule created: {label} ✓' },
  toastRuleExists:      { zh: '该 Org 规则已存在',               en: 'Rule already exists for this Org' },
  toastPatternEmpty:    { zh: 'Pattern 不能为空',               en: 'Domain pattern is required' },
  toastDefaultRestored: { zh: '已恢复默认规则',                   en: 'Default rules restored' },

  // ── URL 检测标签（background.js）─────
  urlLabelProduction:   { zh: '生产环境',                       en: 'Production' },
  urlLabelSandbox:      { zh: '沙盒环境',                       en: 'Sandbox' },
  urlLabelDeveloper:    { zh: '开发者环境',                     en: 'Developer' },
  urlLabelScratch:      { zh: 'Scratch Org',                  en: 'Scratch Org' },

  // ── 规则统计 ──────────────────────────
  rulesCount:           { zh: '{total} rules · {active} active', en: '{total} rules · {active} active' },

  // ── Content ──────────────────────────
  contentEnv:           { zh: '环境',                          en: 'Env' },
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

/** 根据 navigator.language 返回默认语言 */
function detectDefaultLang() {
  const navLang = (typeof navigator !== 'undefined' && navigator.language) || '';
  if (navLang.startsWith('zh')) return 'zh';
  return 'en';
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
