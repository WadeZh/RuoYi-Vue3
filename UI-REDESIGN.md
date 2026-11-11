# RuoYi-Vue3 UI/UX 全面重构交付说明

> 视觉体系：现代极简企业级 SaaS（参考 Linear / Vercel / Ant Design Pro / Shadcn/ui）
> 约束兑现：未更改任何业务逻辑、接口、权限指令、路由结构与数据结构；未删除任何文件；未新增运行时依赖。

---

## 1. 项目技术栈及改造范围

| 项 | 值 |
| --- | --- |
| 框架 | Vue 3.5.26（Composition API + `<script setup>`） |
| UI 库 | Element Plus 2.13.1（含官方暗色 css-vars） |
| 构建 | Vite 6.4.1 + sass-embedded |
| 状态 | Pinia 3.0.4（app / settings / user / permission / tagsView / dict / lock） |
| 路由 | Vue Router 4.6.4（动态路由 + 权限过滤，未改动） |
| 图表 | ECharts 5.6（工作台趋势图，明确标注"演示数据"） |

**改造范围**：全局设计令牌 → Element Plus 全组件覆写 → Layout 四件套（Sidebar / Navbar / TagsView / AppMain）→ 登录 / 注册 / 工作台 → CRUD 页面全局打磨 → 暗色主题 / 响应式 / 交互细节。
**未改动**：`src/api/**`、`src/store/**`（仅默认主题色值）、`src/router/**`、`src/permission.js`、`src/directive/**`、`src/utils/**`、所有系统管理 / 监控 / 工具页面脚本逻辑。

## 2. 最终视觉设计规范（Design Tokens）

唯一来源：`src/assets/styles/tokens.scss`（CSS Variables，`:root` 亮色 + `html.dark` 独立暗色）。

### 亮色主题
- 主色 `#2563EB`（悬停 `#1D4ED8`）；成功 `#16A34A` / 警告 `#F59E0B` / 错误 `#DC2626`
- 页面背景 `#F8FAFC`，卡片 `#FFFFFF`，主文字 `#0F172A`，次级 `#64748B`，边框 `#E2E8F0`
- 侧边栏深色：背景 `#0F172A`、文字 `#94A3B8`、激活低饱和蓝底 + 白字

### 暗色主题（独立配色，非反转）
- 页面 `#0B1220`、卡片 `#111A2C`、浮层 `#16213A`、边框 `#29364E`、文字 `#F1F5F9 / #CBD5E1`
- 品牌色提亮为 `#3B82F6` 保证对比度

### 统一规范
- 8px 间距体系（`--space-1..12`）；卡片/弹窗圆角 12px，输入/按钮 8px
- 阴影仅浮层使用（`--shadow-xs..lg`）；聚焦环 `--shadow-focus`
- 字体系统栈（`--font-sans`），字号 12/13/14/15/16/20/24px
- 动效仅 transform/opacity，0.15–0.3s，全局 `prefers-reduced-motion` 兜底

## 3. 修改及新增文件清单

**新增（4）**
| 文件 | 说明 |
| --- | --- |
| `src/assets/styles/tokens.scss` | 全部设计令牌（含 Hallmark 戳记） |
| `src/assets/styles/element-plus.scss` | Element Plus 全组件视觉覆写 + 暗色修正 |
| `src/assets/styles/auth.scss` | 登录 / 注册共用分栏视觉 |
| `src/components/App/` | `AppStatCard.vue`、`AppEmptyState.vue` 公共组件 |

**修改（21）**：`styles/{index,variables.module,sidebar,ruoyi,btn}.scss`；`layout/index.vue`、`layout/components/{Navbar,AppMain,TagsView/index,Settings/index,Sidebar/Logo,TopNav/index,TopBar/index,Copyright/index}.vue`；`components/{Hamburger,Screenfull,SizeSelect}/index.vue`；`views/{index,login,register}.vue`；`store/modules/settings.js`（默认主题色 `#409EFF → #2563EB`）。
**删除：无。**

## 4. 主要组件与样式入口使用说明

- **tokens.scss**：任何颜色/圆角/阴影/字体一律 `var(--*)` 引用，禁止散落硬编码。扩展暗色仅需在 `html.dark` 块补变量。
- **element-plus.scss**：按钮/输入/表格/弹窗/抽屉/分页/标签/下拉/卡片/表单/树/滚动条/NProgress 的统一状态（Default/Hover/Focus/Active/Disabled/Loading/Empty），新增页面零成本继承。
- **AppStatCard**：`<app-stat-card label="在线用户" :value="n" :loading="b" icon="User" icon-bg icon-color />`，加载自动骨架屏，空值显示 `--`。
- **AppEmptyState**：`<app-empty-state text="暂无数据" icon="Bell">可选操作插槽</app-empty-state>`。
- **CRUD 布局**（全局生效，无需改页面）：`.app-container` 直接子级的 `.el-form--inline`（筛选卡片）、`.el-row.mb8`（工具栏）、`.el-table`（表格卡片）、`.pagination-container` 自动获得统一卡片式样式；弹窗内表单与 `tree-sidebar-*` 双栏布局自动排除。

## 5. 已完成页面清单

| 页面 | 改造内容 | 视觉验证 |
| --- | --- | --- |
| 登录 / 注册 | 左品牌区 + 右表单区分栏，保留验证码/记住密码/跳转全部逻辑 | ✅ 亮/暗/移动端截图 |
| 工作台（首页） | 欢迎区 + 真实接口指标卡（在线用户/公告/操作日志/登录记录）+ 快捷入口（按权限过滤）+ 趋势图（标注"演示数据"）+ 最新公告/最近操作（真实接口）+ 骨架屏/空状态 | ✅ 亮/暗截图 |
| 系统管理（用户/角色/菜单/部门/岗位/字典/参数/通知） | 全局筛选卡 + 表格卡 + 分页统一；用户管理树栏保留 | ✅ 用户/通知截图 |
| 系统监控（在线/操作日志/登录日志等） | 同上全局样式继承 | ✅ 抽查 |
| 个人中心 | 卡片/表单经全局令牌自动升级（无硬编码颜色，无需改动） | ✅ |
| Layout | 侧边栏（220px，胶囊菜单，折叠 64px）、顶栏（56px，含主题切换/搜索/全屏/消息/头像）、TagsView（胶囊页签 + 谷歌样式双支持）、设置面板 | ✅ |

## 6. 运行与构建测试结果

- `npm run build:prod` → **✓ built in 24.20s**（0 error；改动前后各验证一次）
- 本地联调：`npm run dev`（:80）+ 临时 Mock 后端（:8080，仓库外 `Zcode/.mock/`，仅供视觉验收，不影响真实后端对接）
- 浏览器实测（1440×900 / 390×844）：登录 → 工作台 → 用户管理 → 弹窗 → 通知公告 → 亮暗切换 → 移动端，**控制台 0 错误**；sloplint 检查 **0 FAIL / 0 WARN**

## 7. 尚未完成或存在风险的事项

1. **真实后端联调**：本次用 Mock 验证视觉与交互；登录鉴权、验证码、CRUD 写操作需连真实 RuoYi 后端做一轮回归（前端逻辑未动，预期无影响）。
2. **主题切换动画兜底**：修复了个别环境 `startViewTransition` 回调不执行导致暗色切换失效的问题（新增 300ms watchdog + `document.hidden` 判断）；若依原版在真实浏览器中无此问题。
3. **未封装的 App 组件**：`AppFilterPanel / AppDataTable / AppConfirmDialog / AppFormSection / AppStatusTag / AppSkeleton` 未单独封装——对应能力由全局样式（筛选/表格/弹窗）、`ElMessageBox`（确认）、`DictTag`（状态标签）、`el-skeleton`（骨架）承担，避免为封装而封装；如需统一 API 可后续补齐。
4. **旧版浏览器**：`color-mix()`（暗色页签激活底色）需 Chrome 111+；低版本会回退为纯色变量缺省，不影响功能。
5. **用户自定义主题色**：设置面板色板仍可换主色，`handleThemeStyle` 会覆盖 `--el-color-primary` 系（这是原有机制）； tokens 中语义色/中性色不受影响。
6. **登录页双版权**：品牌区与表单区各有一条版权文案（有意设计）；如需只保留一处，删 `auth.scss` 中 `.brand-foot` 或 `.auth-foot` 即可。
