# 🛡️ Salesforce Env Guard

> 为不同 Salesforce 环境页面添加彩色边框和醒目标签，彻底避免在**生产环境**上的误操作。

<p align="center">
  <img src="icons/icon128.png" width="128" alt="Salesforce Env Guard">
</p>

## 为什么需要它？

Salesforce 管理员和开发者经常在**生产环境、沙盒、开发者环境、UAT** 之间频繁切换，而这些环境的界面**几乎一模一样**——仅靠 URL 难以快速辨别。

**一旦在生产环境误删数据、修改配置或执行破坏性代码，后果可能是灾难性的。**

Salesforce Env Guard 通过**强视觉提示**解决这个问题：

- 🔴 **生产环境** → 红色边框，时刻提醒"这里很危险"
- 🟠 **沙盒环境** → 琥珀色边框，放心操作
- 🟢 **开发环境** → 绿色边框，自由测试
- 🟣 **UAT 环境** → 紫色边框，验收阶段
- 🔵 **自定义环境** → 蓝色边框，灵活配置

## 功能

| 功能 | 说明 |
|------|------|
| 🎨 **彩色边框叠加** | 在 Salesforce 页面四边渲染醒目的彩色边框（宽度可调） |
| 🏷️ **顶部环境标签** | 页面顶部中央显示环境类型和自定义名称，双重保障 |
| 🔍 **一键自动检测** | 通过 Salesforce REST API 精确识别当前 Org 是否为生产环境 |
| 📋 **灵活规则管理** | 支持按域名精确匹配，拖拽排序优先级，启用/禁用 |
| 🌐 **全域名覆盖** | 兼容 salesforce.com、force.com、cloudforce.com、sfcrmproducts.cn（中国站）等 |
| 🌗 **深色/浅色主题** | 跟随偏好自动切换 |
| 🌍 **中英双语** | 完整支持中文 / English 界面 |
| ☁️ **跨设备同步** | 规则通过 Chrome Storage Sync 自动同步 |

## 使用

1. 安装扩展后，打开任意 Salesforce 页面
2. 点击工具栏扩展图标，打开管理面板
3. 切换到「检测」标签，点击「开始检测」自动识别当前环境并创建规则
4. 或手动在「添加规则」标签中配置域名和环境类型
5. 此后每次打开对应的 Salesforce 页面，四周即显示对应颜色的边框

## 适用人群

- **Salesforce 管理员** — 管理多个 Org，频繁在不同环境间切换
- **Salesforce 开发者** — 在 Sandbox 开发、UAT 测试、最终部署生产
- **Salesforce 顾问** — 同时服务多个客户，每个客户有多个环境
- **任何可能误触生产环境的 Salesforce 用户**

## 安装

### Chrome Web Store

> 即将上架

### 开发者模式

1. `git clone https://github.com/kyriezhao/salesforce-env-guard.git`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」，选择项目目录

## 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存规则和设置，跨设备同步 |
| `tabs` | 识别 Salesforce 标签页，自动应用彩色边框 |
| `activeTab` | 点击扩展时获取当前页面环境信息 |
| `scripting` | 注入边框显示和 Org 环境检测脚本 |
| `cookies` | 读取 Salesforce `sid` Cookie 以识别 Org 环境 |
| 主机权限 | 仅在 `*.salesforce.com` 等 Salesforce 域名下生效 |

**隐私承诺：所有数据处理均在本地浏览器完成，不会向任何外部服务器发送信息。**

## 技术栈

- **Manifest V3** — Chrome 扩展最新标准
- **Service Worker** — 后台任务架构
- **Content Script** — 边框 Overlay 注入
- **Salesforce REST API** — Org 环境精确检测

## License

MIT

---

<p align="center">
  🦊 Design by <a href="https://github.com/kyriezhao">Kyrie Zhao</a> 🐾
</p>
