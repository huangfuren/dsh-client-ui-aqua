# Changelog

## v1.1.0

- **新增：壁纸可直接用「背景插件」的图库（两个插件融合，取向是"bg 出图、aqua 呈现"）**。壁纸模式下若本地没有上传的图，aqua 会 `POST /bg-rpc {op:'load'}` 读一次背景插件（`@deepseek-ai/dsh-bg`）的配置，取其 `current` 图片的 `/bg-file/<id>` 作为壁纸来源。收益：不必再把整张图塞进 `localStorage` 的 data URL（配额有限、换浏览器即失、两个插件各存一套图）；**零新增路由**（bg 已有 `/bg-rpc` 与 `/bg-file`）。切换时机：aqua 挂载时、切到壁纸模式时、以及清空本地上传壁纸时；bg 未安装/未启用/未选图则安静回落成流体背景。`bgWallpaper` 刻意不落 `localStorage`（派生状态，存下来就是会过期的副本）。本地上传的图仍然优先。
- **可被插件安装器安装**：补上 `dsh.bundle.patch` 与根级 `cordis.patch.yml`（自插 `ui-aqua`）。此前本包只有 `dsh.client`，没有组合包声明，DSH 的插件安装器（桌面版「添加插件」/`dsh plugin add`）会以 `not-a-bundle` 直接拒绝；只能靠 `install.ps1` 或手改 profile 才能装。范式与 `dsh-conversation` / `dsh-localsend` 一致。`files` 补上 `cordis.patch.yml`。
- 版本号补记：v1.0.12 原本只是给上一条留的占位版本号，未发布，直接并入 v1.1.0。
- **源码与产物双端同步**：`src/client/theme-layer.ts` 与 `lib/client.js` 均已修改（产物必须手改——本插件 devDeps 残缺，无法独立构建）。

## v1.0.11

- **根治「右半屏马赛克 + 视口正中竖缝」**：真凶是全屏的 `[data-dsh-aqua-ambient]` 上挂着的 `dsh-aqua-breathe 9s infinite alternate`（opacity 0.86⇄1）。该元素是 `position: fixed; inset: 0`，且**包裹着全屏 WebGL 流体 canvas 与 14 个动画 SVG**：`opacity < 1` 且动画在跑 → 整棵子树必须渲染进独立的合成缓冲（transparency group），而子节点每帧重绘 → 该缓冲每帧被标脏，Chromium 转用**低分辨率 tile** 服务它 → 水面成块状马赛克、tile 边界即**视口水平中点的竖直硬缝**、上层文字被冲淡。因为动画是 `infinite`，伪影**永不消失**（关掉插件就消失，正是因为它同时去掉了动画与透明分组）。现整段移除（含 `@keyframes`），并在 CSS 里留注释说明「透明度动画绝不能挂在这个会包裹 canvas 的全屏层上」；以后要做呼吸感，应挂到**与 canvas 平级**的独立覆盖层。
- **水面调色板改用主题服务判定**：`fluidParams()` 原来读 `<body>[data-ds-dark-theme]`，而该属性在 aqua 挂载**之后**才落上，导致深色模式下 shader 实际拿到的是**浅色**调色板（拦截 `WebGL2RenderingContext.uniform4f` 实测确认），水偏亮、进一步冲淡文字。现改用 `this.dark`（`resolveScheme()` 走 `ctx.theme.getTheme()`），并额外加 `MutationObserver` 监听 `<body>` 的 `data-ds-dark-theme` 兜底。此改动同时保留了 v1.0.10 的 hue 旋转行为。
- **源码与产物双端同步**：`src/client/aqua.module.css`、`src/client/theme-layer.ts` 与 `lib/client.js` 均已修改（产物必须手改——本插件 devDeps 残缺，无法独立构建）。
- ⚠️ **验收提示（重要，避免误判）**：自动化截图（CDP `page.screenshot`）会强制做一次全分辨率重栅格化，会把 low-res tile 伪影"洗掉"，用它判断这类合成伪影会得出"已修复"的错误结论。此类问题必须用**系统级截图**验收。

## v1.0.10

- **修掉「右半屏马赛克 + 中轴硬接缝」**（开启玻璃主题后出现）：根因是 `aqua.module.css` 里给全屏流体 canvas 挂了 `filter: hue-rotate(...)`。CSS `filter` 会把视口大小的 canvas 提升为一个**视口大小的过滤图层**，Chromium 对其分块光栅化时部分 tile 以低分辨率生成，再被放大 → 水面成块状马赛克、中轴（视口宽度一半处）出现硬竖缝，压在上面的文字一起被冲糊。
- **改法：把 hue 旋转从 CSS 滤镜搬进 shader 调色板**。新增 `hueRotate()`，在 `attachFluidShader` 写 `u_color1..3` 之前对三个调色板颜色做 CSS `hue-rotate()` 矩阵旋转，`aqua.module.css`、`--dsh-aqua-fluid-hue` 变量一并移除。**这不是近似**：`hue-rotate()` 是线性矩阵、shader 的三色混合是线性 mix，先转色再混合与先混合再转色等价（默认 316° 的观感与之前一致）。
- 「流体颜色」滑杆改为经 `applySettings()` → `applyFluidPalettes()` 下发给实时 shader（不再是 CSS 变量），所有外观旋钮改动都会同步刷新调色板。
- **源码与产物双端同步**：`src/client/fluid-shader.ts`、`src/client/theme-layer.ts`、`src/client/aqua.module.css` 与 `lib/client.js` 均已修改。产物必须手改——本插件 devDeps 残缺，无法独立构建。
- 遗留同类风险（未改）：壁纸模式的 `--dsh-aqua-wallpaper-blur` 仍是全屏 `filter: blur()`，若把模糊度调大可能复现同样的分块伪影。

## Unreleased

- **面向 dsh 0.1.7-rc.2 的图标兼容（防崩溃）**：宿主在 0.1.7 去掉了图标导出的尺寸后缀（`IconCheckOutline16` → `IconCheckOutline`）。此前产物在运行时 `require("@deepseek-ai/dsh-client-ui-primitives")` 后直取 `.IconCheckOutline16`，升级后该键不存在 → 取到 `undefined` 并被 React 当作组件渲染，**卡片直接崩溃**。现改为按可用性选取 `IconCheckOutline ?? IconCheckOutline16`，并在渲染处加存在性守卫。

## v1.0.9

- **通用设置新增「玻璃主题」开关行**，位置在「字号大小」正下方：宿主通用分区按 `priority → order` 数值稳定排序（字号大小 = 11、其它内置行 ≥ 12），所以开关取 **11.4**、下方玻璃参数旋钮取 **11.5**，既紧贴字号又不会和任何内置行抢位置
- 开关行是独立的「标签 + 开关按钮 + 一句说明」，与下面的玻璃参数旋钮（模式 / 模糊度 / 磨砂度 / 流体颜色 / 背景亮度 / 背景 / 壁纸）分开显示；不必再进「设置 → 插件」就能开关主题
- 补齐开关按钮样式：`.toggle`（幽灵胶囊，开启时 business 填充）此前只在源码里、产物里缺，按钮会没有样式
- **产物已同步**：把组件、`enableInjected`、`.toggle` 样式与注册一起补进产物

## v1.0.8

- 通用设置里的玻璃主题控件去掉独立标题，直接跟在「外观」下方；插件页总开关关闭时，通用设置里的整块调节自动隐藏，打开开关即恢复
- 「选择图片」旁新增提示：浅色壁纸用浅色模式，深色壁纸用深色模式⚠️
- 设置排版统一：壁纸行改为「标签 + 控件」结构，模式/亮度/壁纸三条说明文字全部与所解释的控件列对齐

## v1.0.7

- 背景亮度自动跟随深浅模式：**深色模式只能在 0–50 调节**（压暗，50 原样），**浅色模式只能在 50–100 调节**（提亮，50 原样）；「跟随系统」按实际解析出的深浅色自动切换，旋钮范围与提示文字实时翻转，另一侧的旧值自动失效不干扰

## v1.0.6

- 设置重新布局：总开关留在「插件」页（卡片形状与其他插件一致），其余全部调节（模式/模糊度/磨砂度/流体颜色/背景亮度/背景/壁纸）移到**通用设置 → 外观**的正下方；主题未开启时该行会变暗并提示开关位置

## v1.0.5

- 修复「背景亮度」0–50 无效的问题：黑色遮罩原来画在流体/壁纸**下面**被盖住，现与白色遮罩合并到同一顶层（`::after`），0 = 死黑、100 = 死白、50 = 透明全部生效

## v1.0.4

- 新增「背景亮度」调节（0 = 纯黑、50 = 透明、100 = 纯白），漂浮/兼容两种模式都可用

## v1.0.3

- 安装器改为**优先 zip 下载**（普通 HTTP 更快更稳），git clone 只作后备——git 连 GitHub 不稳时不再白等十几秒

## v1.0.2

- 安装脚本默认安装**最新发布版**（通过 GitHub API 解析，可 `-Version 'v1.0.1'` 指定版本或 `-Version 'main'` 跟随开发分支）
- 修复安装脚本在 Windows PowerShell 下中文提示乱码（UTF-8 BOM）

## v1.0.1

- 兼容模式新增「背景流体颜色」调节入口（颜色旋钮在两种模式下都可用）
- 介绍补充兼容模式（双模式）说明

## v1.0.0

首个正式版本：可开关的玻璃主题，双模式 + 高自由度自定义。

- **漂浮玻璃模式**：顶栏、侧边栏、发送框、统计行、轨迹视图变成悬浮玻璃卡片，聊天区在流体上滑动
- **兼容模式**：保持原版排版一字不动，只把材质换成通用玻璃——按角色和类名子串命中菜单/卡片/气泡/下拉/提示等保守表面，其他插件的界面同样自动玻璃化
- **可调旋钮**（无极滑块 + 数值框）：玻璃模糊度、磨砂度、背景流体颜色
- **背景**：流体板或自定义壁纸（铺满页面、比例不变），壁纸单独可调模糊度/磨砂度，图片自动压缩后本地保存
- 深色玻璃改中性冷灰，磨砂度拉满不再泛蓝；发送栏正确模糊背后的内容
- 问候语等文案功能独立，不在本主题内
- 一键安装 `install.ps1`（按版本号安装，无 git 时自动退回 zip 下载）
