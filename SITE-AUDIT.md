# 上线前自检报告

生成时间：2026-05-21  
目标：GitHub Pages → **kikisun.site**（纯静态，无 Node 代理）

---

## 总结

| 状态 | 说明 |
|------|------|
| 🟢 **可以上线** | 2026-05-21 已补全 `project*.json`（11 个）及缺失图片；请 commit + push 后开启 Pages |

---

## 一、GitHub Pages 部署配置

| 检查项 | 结果 |
|--------|------|
| `site/.nojekyll` | ✅ |
| `site/404.html`（SPA 路由） | ✅ |
| `.github/workflows/deploy-pages.yml` | ✅ |
| `DEPLOY.md` 文档 | ✅ |
| 已 push 到 GitHub | ❌ 仍在本地，需 commit + push |

---

## 二、自定义功能 `_custom/`

| 文件 | 大小 | 结果 |
|------|------|------|
| `ask-kiki-only.js` | ~104KB | ✅ |
| `ask-kiki-only.css` | ~19KB | ✅ |
| `kiki-avatar.png` | ~103KB | ✅ |
| `cv-keyue-sun.pdf` | ~2.7MB | ✅ |
| `index.html` 已注入 v=40 | ✅ |

---

## 三、静态资源 `site/` 体积

| 目录 | 大小 | 文件数 |
|------|------|--------|
| 整站 `site/` | **91MB** | 105 |
| `_assets/` | 51MB | 多数首页图 ✅ |
| `_json/` | 9.3MB | **仅 2 个 JSON** ⚠️ |
| `_woff/` | 26MB | ✅ |
| `about/index.html` | 有 | ✅ About 页可静态访问 |

---

## 四、关键问题：项目页 JSON 缺失

本地磁盘 **没有** 以下文件（GitHub Pages 上会 404）：

```
site/_json/c09d50a1-ac94-435c-b4e5-c08318bfc599/
├── _index.json     ✅ 首页
├── about.json      ✅
├── project.json    ❌
├── project-2.json  ❌
├── project-3.json  ❌
├── project-6.json  ❌
├── project-7.json  ❌
├── project-8.json  ❌
└── project-9.json  ❌
```

**影响：** 首页可能正常；点击 My Work 进入 `/project`、`/project-2` 等会加载失败。

**说明：** 本地 `npm start` 时 `server.mjs` 会从旧站 **代理** 这些 JSON，所以本地看起来正常——**不能**代表 GitHub Pages 上线后的效果。

---

## 五、首页图片

| 检查项 | 结果 |
|--------|------|
| 首页主要项目卡片大图 | ✅ 已在 `_assets/v11/` |
| 缺失 1 张 PNG | ❌ `35e1309e613ac9d1f9c17f8ec5d7ad0eeffd91bb.png`（影响较小，可能某处装饰图） |

---

## 六、模拟 GitHub Pages（纯静态）

| URL | 静态托管预期 |
|-----|----------------|
| `/` | ✅ `index.html` |
| `/about` | ✅ `about/index.html` |
| `/project` | 🟡 HTML 靠 `404.html` 可打开，**JSON 404** |
| `/_json/.../project.json` | ❌ 文件不存在 |

---

## 七、上线前必做（按顺序）

### 1. 一次性补全 `site/_json/.../`（阻塞项）

从 **Figma Sites 发布包** 或 **旧站仍在线时** 把缺失的 `project*.json`（及 `_cms/` 如有）复制进：

```
site/_json/c09d50a1-ac94-435c-b4e5-c08318bfc599/
```

可选命令（旧站仍可达时，仅作**一次性打包**，不是长期镜像）：

```bash
cd kikisun-prod-clone
node mirror.mjs   # 会补全 _json、_assets 等
```

补全后重新跑自检：确认 `project.json` 等文件在磁盘上存在。

### 2. 提交部署相关文件

```bash
git add DEPLOY.md SITE-AUDIT.md .github site/.nojekyll site/404.html README.md site/_json site/_assets
git commit -m "Add deploy config and complete site assets for kikisun.site"
git push origin main
```

### 3. GitHub Pages + DNS

见 [DEPLOY.md](./DEPLOY.md)。

---

## 八、上线后复检清单

- [ ] https://kikisun.site 首页
- [ ] 至少打开 3 个项目页（Solplanet、BMW、Decathlon 等）
- [ ] 浏览器 Network 无大量 `_json/project-*.json` 404
- [ ] Ask Kiki、中英切换、Resume 下载
- [ ] HTTPS 已启用
