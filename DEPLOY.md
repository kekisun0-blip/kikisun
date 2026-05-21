# 部署到 kikisun.site（新站替换旧站）

旧版 `www.kikisun.site` 将被本仓库内容**完全替换**。不再依赖「从旧站镜像拉资源」；所有页面、图片、JSON 必须一次性放进 `site/` 后再上线。

---

## 一、上线前检查（必做）

### 1. `site/` 必须是完整静态包

当前仓库若只有少量 `_json/*.json`，项目内页（`/project`、`/project-2` 等）在 GitHub Pages 上会**打不开或缺图**。

**一次性补全资源**（任选其一）：

| 方式 | 说明 |
|------|------|
| **A. Figma 导出** | 从 Figma Sites 发布/导出，把所有 `_assets`、`_json`、字体等复制进 `site/` |
| **B. 本地打包脚本** | 若仍有 Figma 预览地址，可改 `mirror.mjs` 的 `BASE_URL` 指向该地址，本地跑一次 `npm run mirror`，把结果 commit 进仓库（只跑一次，不是长期镜像旧站） |
| **C. 手动拷贝** | 把本地已跑通、资源齐全的 `site/` 整个目录提交到 GitHub |

自检：在本地**不启动** `server.mjs`，用静态方式打开或 `npx serve site`，逐个点 My Work、各项目页，确认图片和路由都正常。

### 2. 自定义功能文件（已在仓库）

```
site/_custom/
├── ask-kiki-only.js
├── ask-kiki-only.css
├── kiki-avatar.png
└── cv-keyue-sun.pdf
```

`site/index.html` 里已注入上述 CSS/JS，无需再改 Figma 导出逻辑。

---

## 二、推荐方案：GitHub Pages + 域名 kikisun.site

适合：只想用 GitHub 托管，绑自己的域名，**不需要 Node 服务器**。

```
GitHub 仓库 kekisun0-blip/kikisun
        ↓  push main
GitHub Actions 发布 site/ 目录
        ↓
https://kikisun.site  （自定义域名）
```

### 步骤 1 — 仓库内已有部署文件

确保存在：

- `site/.nojekyll`（空文件，保留 `_assets` 等目录）
- `site/404.html`（与 `index.html` 相同，支持 SPA 路由）
- `.github/workflows/deploy-pages.yml`（自动发布）

本地若还没有 `404.html`：

```bash
cp site/index.html site/404.html
```

### 步骤 2 — 推送到 GitHub

```bash
cd /path/to/kikisun-prod-clone
git add .
git commit -m "Prepare GitHub Pages deploy for kikisun.site"
git push origin main
```

### 步骤 3 — 开启 GitHub Pages

1. 打开 https://github.com/kekisun0-blip/kikisun/settings/pages  
2. **Build and deployment → Source** 选 **GitHub Actions**  
3. 等 Actions 跑绿（约 2–5 分钟）  
4. 临时预览：`https://kekisun0-blip.github.io/kikisun/`（最终以域名为准）

### 步骤 4 — 绑定 kikisun.site

在 **Settings → Pages → Custom domain** 填写：

```
kikisun.site
```

或同时用 `www.kikisun.site`（两个都填则要两条 DNS）。

勾选 **Enforce HTTPS**（证书下发后）。

### 步骤 5 — DNS（在域名注册商 / Cloudflare / 阿里云等）

**根域名 `kikisun.site`（推荐同时保留 www 跳转）**

| 类型 | 主机 | 值 |
|------|------|-----|
| **A** | `@` | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |

**www 子域名**

| 类型 | 主机 | 值 |
|------|------|-----|
| **CNAME** | `www` | `kekisun0-blip.github.io` |

（若只用 `www.kikisun.site` 访问，Custom domain 填 `www.kikisun.site`，DNS 只配 CNAME 即可。）

生效时间：通常 10 分钟～几小时。可用 https://dnschecker.org 检查。

### 步骤 6 — 旧站下线

DNS 指向 GitHub 并生效后，原 Figma Sites / 旧托管上的 `kikisun.site` 可停用，避免两处同时解析。

---

## 三、备选方案：Node 托管（仅当静态包仍缺资源时）

若暂时无法补全 `site/`，可短期用 Node 服务 + 仍从某 URL 拉缺失资源（**上线前应改为纯静态**）。

| 平台 | Start Command | 自定义域名 |
|------|---------------|------------|
| [Render](https://render.com) | `npm start` | Settings → Custom Domains → `kikisun.site` |
| [Railway](https://railway.app) | `npm start` | 同上 |

Render 上 CNAME：`www` → `你的服务.onrender.com`；根域名用平台提供的 A 记录说明。

**长期仍建议迁回 GitHub Pages + 完整 `site/`，免服务器费用与冷启动。**

---

## 四、上线后自检清单

- [ ] https://kikisun.site 首页正常  
- [ ] My Work / 各项目详情可打开  
- [ ] 图片、字体不 404（浏览器 Network 无大量红字）  
- [ ] Ask Kiki、中英切换、Resume 下载 PDF  
- [ ] 手机宽度排版正常  
- [ ] HTTPS 小锁已启用  

---

## 五、日常更新流程

```bash
# 1. 改 site/_custom/*.js 或 site 内资源
# 2. 本地预览（可选）
npm start   # http://127.0.0.1:3344

# 3. 提交并推送 → GitHub Actions 自动重新部署
git add .
git commit -m "Update portfolio"
git push origin main
```

约 2–5 分钟后 kikisun.site 自动更新。

---

## 六、文件与职责对照

| 路径 | 作用 | 上线是否需要 |
|------|------|----------------|
| `site/` | 整站静态文件（**核心**） | ✅ 必须完整 |
| `site/_custom/` | Ask Kiki、双语、TOC 等 | ✅ |
| `.github/workflows/deploy-pages.yml` | 发布到 Pages | ✅ GitHub 方案 |
| `server.mjs` | 本地预览 / Node 托管 | 仅本地或备选托管 |
| `mirror.mjs` | 一次性抓取资源进 `site/` | 仅补资源时用，非日常 |

---

## 七、常见问题

**Q：为什么还要 404.html？**  
GitHub Pages 对 `/project` 这类路径会找物理文件；404 与 index 相同才能让 SPA 路由生效。

**Q：根域名和 www 用哪个？**  
建议对外统一一个（例如只宣传 `https://kikisun.site`），另一个在 DNS 做 301 跳转到主域名。

**Q：推送后站点没更新？**  
到 Actions 看是否成功；Pages 设置里 Source 必须是 **GitHub Actions**。

**Q：和旧 mirror 的区别？**  
旧思路：运行时从旧站拉资源。新思路：**所有资源 commit 在仓库**，旧站下线后仍独立运行。
