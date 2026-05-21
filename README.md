# Kiki Sun Portfolio (Local Clone)

基于 [kikisun.site](https://www.kikisun.site/) 的本地镜像站点，并叠加自定义功能：**Ask Kiki** 对话、简历下载、中英双语切换、项目页右侧 TOC、首页交互动效等。

## 功能

- **Ask Kiki**：右下角聊天入口，FAQ 可视化回答（项目卡片、流程、标签等）
- **简历下载**：点击 Resume 直接下载 PDF
- **中英切换**：站点级 EN / 中文（默认英文）
- **项目 TOC**：项目详情页右侧方法论导航（最多 8 项）
- **首页动效**：Hero 打字机、鼠标聚光灯、卡片 hover 等
- **上游代理**：本地缺失的静态资源自动从 `www.kikisun.site` 拉取

## 环境要求

- [Node.js](https://nodejs.org/) 18+（仅需内置模块，无 npm 依赖）

## 快速开始

```bash
# 克隆后进入目录
cd kikisun-prod-clone

# 启动本地服务（默认 http://127.0.0.1:3344）
npm start
# 或
node server.mjs
```

浏览器打开：**http://127.0.0.1:3344**

自定义端口：

```bash
PORT=8080 node server.mjs
```

## 目录结构

```
kikisun-prod-clone/
├── server.mjs          # 本地静态服务 + SPA 路由 + 上游代理
├── mirror.mjs          # 从 kikisun.site 抓取镜像到 site/
├── package.json
├── README.md
└── site/
    ├── index.html      # SPA 入口（已注入自定义 CSS/JS）
    ├── about/
    ├── _assets/        # 图片等静态资源
    ├── _json/          # 页面 JSON 数据
    ├── _components/    # Figma Sites 组件
    ├── _runtimes/      # 运行时脚本
    └── _custom/        # 自定义功能（核心）
        ├── ask-kiki-only.js
        ├── ask-kiki-only.css
        ├── kiki-avatar.png
        └── cv-keyue-sun.pdf
```

## 更新站点镜像

若需从线站重新抓取资源：

```bash
npm run mirror
# 或
node mirror.mjs
```

> `mirror.mjs` 会覆盖 `site/` 下已有文件，并重新注入 `_custom` 脚本引用。自定义逻辑主要在 `site/_custom/`，更新前建议备份该目录。

## 部署说明

本项目为 **Node 静态服务**，适合：

- 本地预览 / 作品集演示
- 部署到支持 Node 的平台（Railway、Render、VPS 等）

若部署到纯静态托管（GitHub Pages、Vercel Static），需：

1. 预先跑完 `mirror.mjs` 补全所有资源，或
2. 接受部分资源仍走上游代理（需 CORS / 反向代理配置）

## 许可与版权

- 站点视觉与内容由 **Kiki Sun** 作品集所有。
- 本仓库代码（`server.mjs`、`mirror.mjs`、`site/_custom/*`）供个人作品集维护使用。
- 请勿将整站内容用于未授权的商业转载。

## 作者

**Kiki Sun（孙可月）** — [kikisun.site](https://www.kikisun.site/)
