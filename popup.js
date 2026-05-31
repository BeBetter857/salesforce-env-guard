// popup.js — 管理面板逻辑

// ─────────────────────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#ef4444', // red - production
  '#f97316', // orange
  '#f59e0b', // amber - sandbox
  '#eab308', // yellow
  '#22c55e', // green - development
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet - uat
  '#ec4899', // pink
  '#6b7280', // gray
];

const ENV_AUTO_COLORS = {
  production:  '#ef4444',
  sandbox:     '#f59e0b',
  development: '#22c55e',
  uat:         '#8b5cf6',
  custom:      '#3b82f6',
};

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────

let rules         = [];
let settings      = { borderWidth: 4, showLabel: true };
let editingId     = null; // null = adding new, string = editing existing
let currentTabUrl = null; // 当前标签页 URL，用于本地规则匹配
const expandedRuleIds = new Set();

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Theme 初始化
// ─────────────────────────────────────────────────────────────

async function initTheme() {
  let theme = 'light';
  try {
    const data = await chrome.storage.sync.get('theme');
    theme = data.theme || 'light';
  } catch {}
  applyTheme(theme);
  document.getElementById('themeSelect').value = theme;

  document.getElementById('themeSelect').addEventListener('change', async (e) => {
    const newTheme = e.target.value;
    applyTheme(newTheme);
    await chrome.storage.sync.set({ theme: newTheme });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// ─────────────────────────────────────────────────────────────
// i18n 初始化
// ─────────────────────────────────────────────────────────────

async function initI18n() {
  // 从 storage 读取语言设置
  let lang = 'zh';
  try {
    const data = await chrome.storage.sync.get('lang');
    lang = data.lang || detectDefaultLang();
  } catch {
    lang = detectDefaultLang();
  }
  setLang(lang);
  document.getElementById('langSelect').value = lang;
  applyI18n();

  // 语言切换
  document.getElementById('langSelect').addEventListener('change', async (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    await chrome.storage.sync.set({ lang: newLang });
    sendMsg({ type: 'SET_LANG', lang: newLang }).catch(() => {});
    applyI18n();
    // 重新渲染需要动态翻译的部分
    renderRules();
    updateRuleCount();
    updateCurrentEnvLocal();
  });
}

function applyI18n() {
  // 处理 textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  // 处理 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // 处理 title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();
  initPresetColors();
  initColorPicker();
  initTabNav();
  initFormEvents();
  initSettingsEvents();
  initDragDrop();
  await initI18n();
  await loadAll();
});

async function loadAll() {
  // 独立加载，各自渲染——不等最慢的那个
  sendMsg({ type: 'GET_RULES' }).then(res => {
    rules = (res && res.rules) ? res.rules : [];
    renderRules();
    updateRuleCount();
    updateCurrentEnvLocal();
  }).catch(() => {});

  sendMsg({ type: 'GET_SETTINGS' }).then(res => {
    settings = (res && res.settings) ? res.settings : { borderWidth: 4, showLabel: true };
    renderSettings();
  }).catch(() => {});

  sendMsg({ type: 'GET_CURRENT_TAB_MATCH' }).then(res => {
    currentTabUrl = (res && res.url) ? res.url : null;
    renderCurrentEnv(res && res.rule ? res.rule : null, currentTabUrl);
  }).catch(() => {});
}

async function refreshCurrentEnv() {
  const matchRes = await sendMsg({ type: 'GET_CURRENT_TAB_MATCH' });
  currentTabUrl = matchRes.url || currentTabUrl;
  renderCurrentEnv(matchRes.rule, matchRes.url);
}

/** 用内存中的 rules 做本地匹配，不读 storage，即时响应 */
async function updateCurrentEnvLocal() {
  if (!currentTabUrl) return;
  try {
    const matchRes = await sendMsg({ type: 'MATCH_URL_RULES', url: currentTabUrl, rules });
    renderCurrentEnv(matchRes.rule, matchRes.url);
  } catch {
    // 匹配失败忽略，下次 refreshCurrentEnv 会修正
  }
}

// ─────────────────────────────────────────────────────────────
// Tab navigation
// ─────────────────────────────────────────────────────────────

function initTabNav() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      if (tab === 'add' && !editingId) resetForm();
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });
}

// ─────────────────────────────────────────────────────────────
// Current env indicator
// ─────────────────────────────────────────────────────────────

function renderCurrentEnv(rule, url) {
  const bar = document.getElementById('currentEnvBar');
  if (!rule) {
    bar.innerHTML = `<span class="no-match-text">${t('noMatch')}</span>`;
    return;
  }
  bar.innerHTML = `
    <span class="current-env-dot" style="background:${escHtml(rule.color)}; box-shadow:0 0 6px ${escHtml(rule.color)}88"></span>
    <span class="current-env-text" style="color:var(--text1)">${escHtml(rule.label || rule.pattern)}</span>
    <span class="current-env-badge env-chip ${rule.environmentType}" >${t('envType_' + rule.environmentType)}</span>
  `;
}

// ─────────────────────────────────────────────────────────────
// Rules list rendering
// ─────────────────────────────────────────────────────────────

function renderRules() {
  const list  = document.getElementById('rulesList');
  const empty = document.getElementById('emptyState');

  // Remove existing cards (keep empty state node)
  list.querySelectorAll('.rule-card').forEach(el => el.remove());

  if (rules.length === 0) {
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  rules.forEach(rule => {
    const card = buildRuleCard(rule);
    list.appendChild(card);
  });
}

function buildRuleCard(rule) {
  const card = document.createElement('div');
  const isExpanded = expandedRuleIds.has(rule.id);
  const domain = normalizeRuleDomain(rule.pattern);
  const matchDomains = buildMatchDomains(domain);

  card.className = `rule-card${rule.enabled ? '' : ' disabled'}${isExpanded ? ' expanded' : ''}`;
  card.dataset.id = rule.id;

  card.innerHTML = `
    <div class="rule-main">
      <span class="drag-handle" draggable="true" title="${t('dragHandleTitle')}">⋮⋮</span>
      <div class="rule-expand" title="${isExpanded ? t('btnCollapse') : t('btnExpand')}">${isExpanded ? '▾' : '▸'}</div>
      <div class="rule-color-swatch" style="background:${escHtml(rule.color)}"></div>
      <div class="rule-info">
        <div class="rule-label">${escHtml(rule.label || domain || '(no label)')}</div>
        <span class="rule-domain">${escHtml(domain || rule.pattern)}</span>
      </div>
      <span class="env-chip ${rule.environmentType}">${t('envType_' + rule.environmentType)}</span>
      <div class="rule-actions">
        <button class="icon-btn toggle-btn ${rule.enabled ? 'toggle-on' : 'toggle-off'}"
                title="${rule.enabled ? t('btnDisable') : t('btnEnable')}" data-id="${rule.id}">
          ${rule.enabled ? '◉' : '○'}
        </button>
        <button class="icon-btn edit-btn" title="${t('btnEdit')}" data-id="${rule.id}">✎</button>
        <button class="icon-btn delete delete-btn" title="${t('btnDelete')}" data-id="${rule.id}">✕</button>
      </div>
    </div>
    <div class="rule-match-list">
      <div class="rule-match-title">${t('ruleMatchTitle')}</div>
      ${matchDomains.map(item => `
        <div class="rule-match-row">
          <span class="rule-match-kind">${escHtml(item.kind)}</span>
          <span class="rule-match-domain">${escHtml(item.domain)}</span>
        </div>
      `).join('')}
    </div>
  `;

  card.addEventListener('click', () => {
    if (expandedRuleIds.has(rule.id)) expandedRuleIds.delete(rule.id);
    else expandedRuleIds.add(rule.id);
    renderRules();
  });
  card.querySelector('.toggle-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleRule(rule.id);
  });
  card.querySelector('.edit-btn').addEventListener('click', e => {
    e.stopPropagation();
    startEdit(rule.id);
  });
  card.querySelector('.delete-btn').addEventListener('click', e => {
    e.stopPropagation();
    deleteRule(rule.id);
  });

  return card;
}

// ─────────────────────────────────────────────────────────────
// Drag & Drop 排序
// ─────────────────────────────────────────────────────────────

function initDragDrop() {
  const list = document.getElementById('rulesList');
  let dragIndex = -1;

  /** 获取当前规则卡片列表（排除 emptyState） */
  function getCards() {
    return [...list.querySelectorAll('.rule-card')];
  }

  list.addEventListener('dragstart', e => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;

    const card = handle.closest('.rule-card');
    if (!card) return;

    dragIndex = getCards().indexOf(card);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    // Firefox 需要 setData 才能触发 drop
    e.dataTransfer.setData('text/plain', '');
  });

  list.addEventListener('dragend', () => {
    list.querySelectorAll('.rule-card.dragging').forEach(el => el.classList.remove('dragging'));
    list.querySelectorAll('.rule-card.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragIndex = -1;
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    const card = e.target.closest('.rule-card');
    if (!card || card.classList.contains('dragging')) return;

    e.dataTransfer.dropEffect = 'move';
    list.querySelectorAll('.rule-card.drag-over').forEach(el => {
      if (el !== card) el.classList.remove('drag-over');
    });
    card.classList.add('drag-over');
  });

  list.addEventListener('dragleave', e => {
    const card = e.target.closest('.rule-card');
    if (!card) return;
    // 仅在真正离开卡片时移除样式
    if (!card.contains(e.relatedTarget)) {
      card.classList.remove('drag-over');
    }
  });

  list.addEventListener('drop', async e => {
    e.preventDefault();
    const targetCard = e.target.closest('.rule-card');
    if (!targetCard || targetCard.classList.contains('dragging') || dragIndex < 0) return;

    targetCard.classList.remove('drag-over');

    const targetIndex = getCards().indexOf(targetCard);
    if (targetIndex === dragIndex || targetIndex < 0) return;

    // 重排 rules：移除拖拽项，插入到目标位置
    const [moved] = rules.splice(dragIndex, 1);
    rules.splice(targetIndex, 0, moved);

    renderRules();
    updateRuleCount();
    updateCurrentEnvLocal();   // 用内存 rules 即时匹配
    persistRules().catch(() => {});
    dragIndex = -1;
  });

  // 拖拽手柄点击不触发展开/收起
  list.addEventListener('click', e => {
    if (e.target.closest('.drag-handle')) {
      e.stopPropagation();
    }
  });
}

function updateRuleCount() {
  const enabled = rules.filter(r => r.enabled).length;
  document.getElementById('ruleCount').textContent = t('rulesCount', { total: rules.length, active: enabled });
}

// ─────────────────────────────────────────────────────────────
// Rule CRUD
// ─────────────────────────────────────────────────────────────

function toggleRule(id) {
  rules = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
  renderRules();
  updateRuleCount();
  updateCurrentEnvLocal();   // 用内存 rules 即时匹配
  persistRules().catch(() => {});  // 后台写入 storage
}

function deleteRule(id) {
  rules = rules.filter(r => r.id !== id);
  expandedRuleIds.delete(id);
  if (editingId === id) {
    editingId = null;
    resetForm();
  }
  renderRules();
  updateRuleCount();
  updateCurrentEnvLocal();   // 用内存 rules 即时匹配
  persistRules().catch(() => {});  // 后台写入 storage
  showToast(t('toastRuleDeleted'));
}

function startEdit(id) {
  const rule = rules.find(r => r.id === id);
  if (!rule) return;
  editingId = id;

  // Populate form
  document.getElementById('fPattern').value  = rule.pattern;
  document.getElementById('fEnvType').value  = rule.environmentType;
  document.getElementById('fLabel').value    = rule.label || '';
  setColor(rule.color);

  document.getElementById('formTitle').textContent = t('formTitleEdit');
  document.getElementById('cancelEditBtn').style.display = '';

  // Highlight card
  document.querySelectorAll('.rule-card').forEach(c => c.classList.remove('editing'));
  document.querySelector(`.rule-card[data-id="${id}"]`)?.classList.add('editing');

  switchTab('add');
}

async function saveRule() {
  const pattern = document.getElementById('fPattern').value.trim();
  const label   = document.getElementById('fLabel').value.trim();
  const envType = document.getElementById('fEnvType').value;
  const color   = document.getElementById('fColorHex').value.trim() || '#3b82f6';

  if (!pattern) {
    document.getElementById('fPattern').focus();
    showToast(t('toastPatternEmpty'));
    return;
  }

  if (editingId) {
    rules = rules.map(r => r.id === editingId
      ? { ...r, pattern, label, environmentType: envType, color }
      : r
    );
    editingId = null;
    document.querySelectorAll('.rule-card').forEach(c => c.classList.remove('editing'));
  } else {
    rules.push({
      id:              'rule_' + Date.now(),
      pattern,
      environmentType: envType,
      color,
      label,
      enabled:         true,
    });
  }

  renderRules();
  updateRuleCount();
  updateCurrentEnvLocal();   // 用内存 rules 即时匹配
  persistRules().catch(() => {});
  resetForm();
  switchTab('rules');
  showToast(t('toastRuleSaved'));
}

async function persistRules() {
  await sendMsg({ type: 'SAVE_RULES', rules });
}

// ─────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────

function initFormEvents() {
  document.getElementById('saveRuleBtn').addEventListener('click', saveRule);
  document.getElementById('resetFormBtn').addEventListener('click', resetForm);
  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    editingId = null;
    document.querySelectorAll('.rule-card').forEach(c => c.classList.remove('editing'));
    resetForm();
    switchTab('rules');
  });

  // Auto-set color when env type changes (only if user hasn't customized)
  document.getElementById('fEnvType').addEventListener('change', e => {
    const suggested = ENV_AUTO_COLORS[e.target.value];
    if (suggested) setColor(suggested);
  });
}

function resetForm() {
  editingId = null;
  document.getElementById('fPattern').value = '';
  document.getElementById('fLabel').value   = '';
  document.getElementById('fEnvType').value = 'production';
  setColor('#ef4444');
  document.getElementById('formTitle').textContent   = t('formTitleNew');
  document.getElementById('cancelEditBtn').style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
// Color picker
// ─────────────────────────────────────────────────────────────

function initPresetColors() {
  const wrap = document.getElementById('presetColors');
  PRESET_COLORS.forEach(c => {
    const dot = document.createElement('div');
    dot.className = 'preset-dot';
    dot.style.background = c;
    dot.title = c;
    dot.addEventListener('click', () => setColor(c));
    wrap.appendChild(dot);
  });
}

function initColorPicker() {
  const picker = document.getElementById('fColorPicker');
  const hex    = document.getElementById('fColorHex');

  picker.addEventListener('input', () => {
    hex.value = picker.value.toUpperCase();
    syncPresetSelection(picker.value);
  });

  hex.addEventListener('input', () => {
    const val = hex.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      picker.value = val;
      syncPresetSelection(val);
    }
  });
}

function setColor(color) {
  const normalized = color.toLowerCase();
  document.getElementById('fColorPicker').value = normalized;
  document.getElementById('fColorHex').value    = normalized.toUpperCase();
  syncPresetSelection(normalized);
}

function syncPresetSelection(color) {
  document.querySelectorAll('.preset-dot').forEach(dot => {
    dot.classList.toggle('selected', dot.style.background.toLowerCase() === color.toLowerCase()
      || rgbToHex(dot.style.background).toLowerCase() === color.toLowerCase()
    );
  });
}

function rgbToHex(rgb) {
  const m = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!m) return rgb;
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

function normalizeSalesforceHost(hostname) {
  hostname = String(hostname || '').trim().toLowerCase().replace(/^\./, '');
  if (hostname.endsWith('.lightning.force.com'))
    return hostname.replace('.lightning.force.com', '.my.salesforce.com');
  if (hostname.endsWith('.force.com.mcas.ms'))
    return hostname.replace('.force.com.mcas.ms', '.force.com');
  if (hostname.endsWith('.salesforce-setup.com'))
    return hostname.replace('.salesforce-setup.com', '.salesforce.com');
  if (hostname.endsWith('.setup.sfcrmproducts.cn'))
    return hostname.replace('.setup.sfcrmproducts.cn', '.my.sfcrmproducts.cn');
  if (hostname.endsWith('.lightning.sfcrmapps.cn'))
    return hostname.replace('.lightning.sfcrmapps.cn', '.my.sfcrmproducts.cn');
  return hostname;
}

function normalizeRulePattern(pattern) {
  const raw = String(pattern || '').trim().toLowerCase();
  if (!raw) return raw;

  try {
    const parsed = new URL(raw.includes('://') ? raw : 'https://' + raw);
    const normalizedHost = normalizeSalesforceHost(parsed.hostname);
    return raw.includes('://') || raw.includes('/')
      ? raw.replace(parsed.hostname, normalizedHost)
      : normalizedHost;
  } catch {
    return normalizeSalesforceHost(raw);
  }
}

function normalizeRuleDomain(pattern) {
  const normalized = normalizeRulePattern(pattern);
  try {
    return new URL(normalized.includes('://') ? normalized : 'https://' + normalized).hostname;
  } catch {
    return normalized.split('/')[0];
  }
}

function buildMatchDomains(domain) {
  const items = [];
  const add = (kind, value) => {
    if (!value || items.some(item => item.domain === value)) return;
    items.push({ kind, domain: value });
  };

  add('Domain', domain);

  if (domain.endsWith('.my.salesforce.com')) {
    add('Lightning', domain.replace('.my.salesforce.com', '.lightning.force.com'));
    add('Setup', domain.replace('.my.salesforce.com', '.my.salesforce-setup.com'));
  }

  if (domain.endsWith('.my.sfcrmproducts.cn')) {
    add('Lightning CN', domain.replace('.my.sfcrmproducts.cn', '.lightning.sfcrmapps.cn'));
    add('Setup CN', domain.replace('.my.sfcrmproducts.cn', '.setup.sfcrmproducts.cn'));
  }

  return items;
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────

function renderSettings() {
  const slider = document.getElementById('sBorderWidth');
  slider.value = settings.borderWidth ?? 4;
  document.getElementById('sBorderWidthVal').textContent = slider.value + 'px';
  document.getElementById('sShowLabel').checked = settings.showLabel !== false;
}

function initSettingsEvents() {
  const slider = document.getElementById('sBorderWidth');
  slider.addEventListener('input', () => {
    document.getElementById('sBorderWidthVal').textContent = slider.value + 'px';
    debounceSaveSettings();
  });

  document.getElementById('sShowLabel').addEventListener('change', debounceSaveSettings);

  document.getElementById('resetDefaultBtn').addEventListener('click', () => {
    rules = [];
    renderRules();
    updateRuleCount();
    updateCurrentEnvLocal();   // 用内存 rules 即时匹配
    persistRules().catch(() => {});
    showToast(t('toastRulesCleared'));
  });
}

let settingsTimer = null;
function debounceSaveSettings() {
  clearTimeout(settingsTimer);
  settingsTimer = setTimeout(async () => {
    settings = {
      borderWidth: parseInt(document.getElementById('sBorderWidth').value),
      showLabel:   document.getElementById('sShowLabel').checked,
    };
    await sendMsg({ type: 'SAVE_SETTINGS', settings });
  }, 300);
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ─────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg).catch(() => ({}));
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────
// 检测 Tab 逻辑
// ─────────────────────────────────────────────────────────────

let lastDetectResult = null; // 保存最近一次检测结果，用于创建规则

function initDetectTab() {
  document.getElementById('detectRunBtn').addEventListener('click', runDetect);
  document.getElementById('detectCreateRuleBtn')?.addEventListener('click', createRuleFromDetect);
}

async function runDetect() {
  const btn      = document.getElementById('detectRunBtn');
  const btnText  = document.getElementById('detectBtnText');
  const resultEl = document.getElementById('detectResult');

  // Loading state
  btn.classList.add('loading');
  btn.innerHTML = `<div class="detect-spinner"></div><span id="detectBtnText">${t('detectDetecting')}</span>`;
  resultEl.style.display = 'none';
  lastDetectResult = null;

  try {
    const res = await sendMsg({ type: 'DETECT_SF_ENV' });
    lastDetectResult = res;
    renderDetectResult(res);
  } catch (e) {
    renderDetectResult({ success: false, error: e.message });
  } finally {
    btn.classList.remove('loading');
    btn.innerHTML = `<span id="detectBtnIcon">⚡</span><span id="detectBtnText">${t('detectBtnRetry')}</span>`;
  }
}

function renderDetectResult(data) {
  const resultEl  = document.getElementById('detectResult');
  const badge     = document.getElementById('detectBadge');
  const badgeIcon = document.getElementById('detectBadgeIcon');
  const badgeLbl  = document.getElementById('detectBadgeLabel');
  const sourceTag = document.getElementById('detectSourceTag');
  const detailGrid= document.getElementById('detectDetailGrid');
  const warningEl = document.getElementById('detectWarning');
  const actionsEl = document.getElementById('detectActions');

  resultEl.style.display = '';

  // ── Error state ──
  if (!data.success) {
    badge.className = 'detect-result-badge is-error';
    badgeIcon.textContent = '❌';
    badgeLbl.textContent  = data.error || t('detectFailed');
    sourceTag.textContent = '';
    detailGrid.innerHTML  = '';
    warningEl.style.display = 'none';
    actionsEl.style.display = 'none';
    return;
  }

  // ── Determine final env ──
  const isSandbox  = data.orgInfo ? data.orgInfo.isSandbox : (data.urlEnv?.type !== 'production');
  const orgType    = data.orgInfo?.orgType || '';
  const isProduction = data.orgInfo
    ? (!data.orgInfo.isSandbox && !orgType.toLowerCase().includes('developer') && !orgType.toLowerCase().includes('scratch'))
    : data.urlEnv?.type === 'production';

  let badgeClass, icon, envLabel;
  if (!data.orgInfo && data.source === 'url') {
    // URL 判断
    badgeClass = data.urlEnv?.type === 'production' ? 'is-production' : 'is-sandbox';
    icon = data.urlEnv?.type === 'production' ? '🔴' : '🟡';
    envLabel = data.urlEnv?.label || data.urlEnv?.type;
  } else if (data.orgInfo?.isSandbox) {
    badgeClass = 'is-sandbox';
    icon = '🟡';
    envLabel = t('envSandbox');
  } else if (orgType.toLowerCase().includes('developer')) {
    badgeClass = 'is-other';
    icon = '🔵';
    envLabel = t('envDeveloperEdition');
  } else if (orgType.toLowerCase().includes('scratch')) {
    badgeClass = 'is-other';
    icon = '🟣';
    envLabel = t('envScratch');
  } else {
    badgeClass = 'is-production';
    icon = '🔴';
    envLabel = t('envProduction');
  }

  badge.className = `detect-result-badge ${badgeClass}`;
  badgeIcon.textContent = icon;
  badgeLbl.textContent  = envLabel;

  const sourceMap = { api: t('detectApiExact'), url: t('detectUrlGuess'), url_fallback: t('detectUrlFallback') };
  sourceTag.textContent = sourceMap[data.source] || data.source;

  // ── Detail rows ──
  const rows = [];

  if (data.orgInfo?.orgName) rows.push({ key: t('detectOrgName'), val: data.orgInfo.orgName, cls: 'bold' });
  if (data.orgInfo?.orgType) rows.push({ key: t('detectOrgType'), val: data.orgInfo.orgType });
  if (data.orgInfo?.orgId)   rows.push({ key: t('detectOrgId'),   val: data.orgInfo.orgId,   cls: 'mono' });

  rows.push({ key: t('detectInstanceUrl'), val: data.instanceUrl, cls: 'mono' });

  // IsSandbox 明确标记
  if (data.orgInfo) {
    rows.push({
      key: t('detectIsSandbox'),
      val: data.orgInfo.isSandbox ? '✓ true  — ' + t('detectNonProd') : '✗ false — ' + t('detectIsProd'),
      cls: data.orgInfo.isSandbox ? '' : 'bold'
    });
  }

  if (data.sessionId) {
    const tokenLabel = data.tokenSource === 'oauth_cache' ? ' (OAuth)' : ' (Cookie sid)';
    rows.push({ key: t('detectSession'), val: data.sessionId + tokenLabel, cls: 'mono' });
  }

  if (data.apiSource) {
    rows.push({ key: t('detectApiMethod'), val: { page_fetch: 'Same-Origin fetch', bearer_token: 'Bearer Token' }[data.apiSource] || data.apiSource });
  }

  detailGrid.innerHTML = rows.map(r => `
    <div class="detect-detail-row">
      <span class="detect-detail-key">${escHtml(r.key)}</span>
      <span class="detect-detail-val ${r.cls || ''}">${escHtml(r.val)}</span>
    </div>
  `).join('');

  // ── Warning ──
  if (data.warning) {
    warningEl.style.display = '';
    warningEl.innerHTML = `⚠️ <span>${escHtml(data.warning)}</span>`;
  } else {
    warningEl.style.display = 'none';
  }

  // ── Create rule action（有 instanceUrl 才显示）──
  if (data.instanceUrl) {
    actionsEl.style.display = '';
    // Pre-fill label
    const suggested = data.orgInfo?.orgName || (isProduction ? 'Production' : envLabel);
    document.getElementById('detectRuleLabel').value = suggested;
  } else {
    actionsEl.style.display = 'none';
  }
}

async function createRuleFromDetect() {
  const data = lastDetectResult;
  if (!data?.instanceUrl) return;

  const label = document.getElementById('detectRuleLabel').value.trim() || 'Detected Org';

  // 保存 canonical host：data.lightning.force.com / data.my.salesforce-setup.com
  // 都归一为 data.my.salesforce.com，确保创建后立即命中当前页面。
  const hostname = normalizeSalesforceHost(new URL(data.instanceUrl).hostname);

  const orgType = data.orgInfo?.orgType?.toLowerCase() || '';
  let envType = 'production';
  if (data.orgInfo?.isSandbox)              envType = 'sandbox';
  else if (orgType.includes('developer'))   envType = 'development';
  else if (orgType.includes('scratch'))     envType = 'custom';

  const ENV_COLORS = {
    production: '#ef4444', sandbox: '#f59e0b',
    development: '#22c55e', uat: '#8b5cf6', custom: '#3b82f6'
  };

  // 检查是否已存在相同 pattern
  const existing = rules.find(r => normalizeRulePattern(r.pattern) === hostname);
  if (existing) {
    showToast(t('toastRuleExists'));
    return;
  }

  rules.push({
    id:              'rule_' + Date.now(),
    pattern:         hostname,
    environmentType: envType,
    color:           ENV_COLORS[envType],
    label,
    enabled:         true,
  });

  renderRules();
  updateRuleCount();
  updateCurrentEnvLocal();   // 用内存 rules 即时匹配
  persistRules().catch(() => {});
  showToast(t('toastRuleCreated', { label: label }));

  // Switch to rules tab to show the new card
  setTimeout(() => switchTab('rules'), 800);
}

// Init on DOM ready (append to existing DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
  initDetectTab();
});
