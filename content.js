// content.js — 注入到 Salesforce 页面
// 负责渲染彩色边框 overlay 和顶部环境标签

(function () {
  // 防止重复注入
  if (window.__sfBorderGuardInit) {
    return;
  }
  window.__sfBorderGuardInit = true;

  const OVERLAY_ID = '__sf_border_overlay__';
  const LABEL_ID   = '__sf_border_label__';
  const STYLE_ID   = '__sf_border_label_style__';

  // ── 创建/更新边框 overlay ──────────────────────────────────

  function applyBorder(rule, settings) {
    removeBorder();
    if (!rule) return;

    const width = (settings?.borderWidth ?? 4) + 'px';
    const color = rule.color || '#ef4444';

    // 边框 overlay（四边）
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      right:         '0',
      bottom:        '0',
      border:        `${width} solid ${color}`,
      pointerEvents: 'none',
      zIndex:        '2147483647',
      boxSizing:     'border-box',
      // 发光效果增强视觉提示
      boxShadow:     `inset 0 0 0 1px ${color}22, 0 0 0 1px ${color}22`
    });

    // 顶部环境标签
    if (settings?.showLabel !== false) {
      const label = document.createElement('div');
      label.id = LABEL_ID;

      const envText = rule.environmentType?.toUpperCase() || 'ENV';
      const labelText = rule.label || '';

      label.innerHTML = `
        <span class="sf-bg-env-type">${envText}</span>
        ${labelText ? `<span class="sf-bg-label-text">${escHtml(labelText)}</span>` : ''}
      `;

      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        #${LABEL_ID} {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 12px 3px 10px;
          background: ${color}dd;
          color: #ffffff;
          font-family: -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          border-radius: 0 0 8px 8px;
          pointer-events: none;
          z-index: 2147483647;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 12px ${color}66;
          user-select: none;
          white-space: nowrap;
        }
        #${LABEL_ID} .sf-bg-env-type {
          opacity: 1;
          font-weight: 800;
          letter-spacing: 0.1em;
        }
        #${LABEL_ID} .sf-bg-label-text {
          opacity: 0.88;
          font-weight: 500;
          font-size: 10px;
          letter-spacing: 0.04em;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(label);
    }

    document.body.appendChild(overlay);
  }

  function removeBorder() {
    document.getElementById(OVERLAY_ID)?.remove();
    document.getElementById(LABEL_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── 监听来自 background 的消息 ────────────────────────────

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SF_BORDER_UPDATE') {
      applyBorder(message.rule, message.settings);
    }
  });

  async function refreshBorder() {
    try {
      const [matchRes, settingsRes] = await Promise.all([
        chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB_MATCH' }),
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' })
      ]);
      applyBorder(matchRes?.rule || null, settingsRes?.settings);
    } catch {
      removeBorder();
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && (changes.orgRules || changes.settings)) {
      refreshBorder();
    }
  });

  // ── 页面加载时主动请求匹配结果 ────────────────────────────
  // （解决 content script 在 background 推送之前已就绪的竞态）
  refreshBorder();

})();
