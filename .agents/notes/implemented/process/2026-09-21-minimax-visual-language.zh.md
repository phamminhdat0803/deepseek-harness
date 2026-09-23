# Agent Note: Web 客户端改用 MiniMax 视觉语言

Status: implemented

[English](2026-09-21-minimax-visual-language.md) | 中文

## 问题

token 表原先固化的是一套从 Chat 前端调研得来的视觉基线：DeepSeek 蓝强调色（`#3964fe`）、18px 胶囊按钮、多层柔和投影、平台 UI 字体栈。该基线锁死了功能组件能触及的每一种颜色、圆角与阴影，因此产品级的视觉语言变更没有单一的落点——只能逐个组件去争论，而评审也拿不到一句机器可校验的"新语言是什么"。

## 决策

Web 客户端采用 MiniMax 设计语言，其依据是生成到仓库根目录的 `DESIGN.md` 参考文档。[`design-platform.css`](../../../../packages/client/ui-theme/src/styles/design-platform.css) 仍是唯一的颜色权威，并保持原有的 light/dark 两块结构与 alias→static 间接层，因此样式表契约断言的每一条消费方约定依然成立；改动的只是取值和少数几条 alias 绑定。

static 阶梯现在是绝对的、源自 MiniMax：ink `#0a0a0a`、canvas `#ffffff`、surface `#f7f8fa`、hairline `#e5e7eb`、steel `#5f5f5f`、stone `#8e8e93`、muted `#a8aab2`。单一蓝色族承担链接、业务态与 info 填充（`#1456f0`、`#1d4ed8`、`#60a5fa`）；珊瑚色族承担注意态，于是 warn 审批面板与风险界面读起来就是品牌的高冲击强调色，而 error 保留自己的红。static 色阶在两个块中声明完全一致，这正是让"整套配色翻转"只由 alias 层承担的原因。

dark 配色是推导而来而非调研得来：参考文档并未发布 dark token。其 canvas 为 `#111113`，高度阶梯为 `#1c1c1e` → `#262628` → `#303032`，使 `bg-layer-2` 与 `bg-layer-3` 始终区别于基础表面，从而滚动条契约的高度判定仍能把"已重绑的表面"与"基础表面"分开。

排版保留原有字号阶梯及其配对行高，因为该阶梯跟随用户 12–17px 的正文字号设置。改变的是字族与字重纪律：[`base.css`](../../../../packages/client/ui-theme/src/styles/base.css) 把 `'DM Sans'` 放在 `'Inter'` 与平台字体栈之前，Markdown 标题各级由 700 降到品牌的 600。DM Sans 不随包分发：只有已安装该字体的机器才会用上该字族，其余字形一律沿字体栈回退。

高度体系转为扁平。四档阴影改为参考文档自身的档位（从 `0 1px 2px rgba(0,0,0,.04)` 到 `0 12px 16px -4px rgba(36,36,36,.08)`），elevation 组合不再是两层柔光，而是保留 0.5px 发丝描边加一层柔光。表面靠发丝与填充色分层，而不是靠光晕。

形状成为品牌签名：每个操作都是胶囊。[`Button.module.css`](../../../../packages/client/ui-primitives/src/Button.module.css) 去掉按尺寸变化的圆角，统一为 `999px` 加 `corner-shape: round`，[`Pill.module.css`](../../../../packages/client/ui-primitives/src/Pill.module.css) 跟随；侧栏的 New Session 在 [`SidebarRoot.module.css`](../../../../packages/client/ui-sidebar/src/client/SidebarRoot.module.css) 中承担 `button-primary` 组合——参考文档把每个界面都锚定在这份 ink 填充上，而它正是客户端最显眼的操作入口。发送控件在 [`InputBar.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/InputBar.module.css) 中从 info 填充改到同一组 `button-primary`：它随主题翻转，而不是在两种主题下都保持蓝色。

有四处组件处理采用参考文档自身的组件，而非近似替代。视图标签页在 [`ConversationRoot.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/ConversationRoot.module.css) 中用 ink 文字配 ink 下划线表示选中——即参考文档的 segmented tab，其选中态不是某种色相。空白会话的标题在 [`HeroShell.module.css`](../../../../packages/client/ui-conversation/src/client/skeleton/HeroShell.module.css) 中位于参考文档的 `heading-lg` 档（40/600、1.20 行高、-1px 字距），鲸鱼标记按该行高定尺，其 Preview 标签是 `badge-beta` 胶囊。侧栏的本地构建版本标签是可读的浅蓝标签，于是 New Session 成为侧栏中唯一的 ink 元素。文字录入界面采用参考文档的输入框档位而非胶囊：单行输入与设置项选择器为 `rounded.md`（8px），输入卡片与反馈文本域为 `rounded.lg`（12px），因为参考文档给自身的 `text-input` 定的是 md 档，并把 `rounded.full` 留给按钮与徽章。于是对话框中的输入框读起来是输入框，而不是胶囊。

## 备选方案

**接入 Tailwind，把参考文档表达成 utility。** 否决：样式框架排除 utility 框架与第二套 token 权威，而且各插件的浏览器 bundle 自行编译 CSS，没有可以承载它的 PostCSS 阶段。产出本决策的那次调研记录了该框架自身的约束。

**只重绘组件，不动配色表。** 否决：真正承载语言的取值仍留在 alias 层，而组件却在改，两边必然漂移，下一个组件又要从截图里反推配色。

**把 DM Sans 打包进 shell。** 属延后而非采纳：分发它需要在 static-linked CSS 路径上发射字体资源，并在自动生成的第三方声明中新增条目，而现有生成器并不覆盖裸资源。该字体既不覆盖 CJK 也不覆盖越南文——Google Fonts 只发布 `latin` 与 `latin-ext`，其区间在 `U+1EA0`–`U+1EF1` 的越南文区段之前就结束——因此即便打包，这些字形仍会在同一行内交回平台字体栈，而这正是"字族优先的字体栈"在不多带任何字节的情况下已经得到的结果。字体栈已经列出该字族，装有它的机器会使用它，回退目标是平台 UI 字体而非第二套显示字体。

**把珊瑚色映射到 error 而非 warn。** 否决：参考文档把珊瑚色留给注意时刻。error 保留独立红色，使两个暖色族在审批与风险界面中仍可区分——而那里两者可能同时出现。

## 后果

只读取语义 alias 的功能组件无需改动即完成换肤，而样式表契约——圆角配对、elevation、滚动条与中性发丝规则——在新取值下依然成立，这正是本次随附 spec 运行所验证的内容。代价是 static token 名仍带着旧品牌词却装着 MiniMax 取值；重命名该色阶会触及每一个直接消费 `--dsw-static-*` 的地方，因此留作后续而非塞进本次换肤。dark 配色现在由我们维护：参考文档并未发布，未来品牌更新必须为 dark 重新推导，而不能照抄。
