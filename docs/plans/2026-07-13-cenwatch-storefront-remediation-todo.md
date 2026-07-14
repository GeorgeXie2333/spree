# CenWatch Storefront 审查修复 TODO

**Status:** In Progress
**Target:** CenWatch Storefront pre-launch
**Depends on:** `cenwatch-storefront-scope.md`, `storefront-security-fixes.md`, Spree Store API v3
**Author:** George / Codex
**Last updated:** 2026-07-13

## Summary

本清单记录 2026-07-13 Storefront 全量审查确认的修复项。必须严格按编号顺序执行，每次只处理一个任务；仅在其完成条件和规定验证均通过后，才将该项标记为完成。既有安全修复计划保持不变，本清单只补充尚未落实或未被其覆盖的问题。

## Key Decisions (do not deviate without discussion)

- P1 任务是发布阻断项；全部完成前不得宣布 Storefront 可发布。
- 每项先添加能复现缺陷的回归测试，再实现修复；不得以降低测试覆盖替代修复。
- Storefront 相关的根 CI、Store API 和持久化改动属于本清单范围；无关应用不在范围内。
- 任务完成必须保留错误可见性：网络或上游故障不能伪装成空数据、成功或 404。

## Ordered TODO

### Release gate

- [x] **SF-001 — 启用 Storefront CI**
  将嵌套工作流迁移或重建到仓库根 `.github/workflows/`，触发路径覆盖 `apps/storefront/**`、根 lockfile、共享 SDK 和工作流本身。统一 Node 22 与 `pnpm install --frozen-lockfile`，执行 Storefront 的 Biome、类型检查、Vitest、locale parity、构建；保留可诊断的失败输出。
  **完成条件：** 修改 Storefront 文件的 PR 会触发工作流；工作流不使用 `npm ci`；四项检查均作为独立可见步骤运行。

- [x] **SF-002 — 建立 Biome 格式基线**
  统一 `next.config.ts` 与其测试文件的换行符，确保 Storefront `biome check .` 无格式错误。
  **完成条件：** 仅发生预期格式变更，且 `pnpm check` 成功。

### P1 — Commerce correctness

- [x] **SF-003 — 严格快捷支付完成判定**
  只有完成端点或后续查询返回真实 completed order 时，才从快捷支付跳转成功页；保留失败状态、恢复可操作 UI 并显示原始本地化错误。
  **完成条件：** 成功、已完成幂等响应和完成失败三种情形均有测试；失败时不会跳转 `order-placed`。

- [x] **SF-004 — 处理普通支付提交失败**
  让结账页消费支付组件的结果；Stripe 缺失、未选支付方式和支付提交失败均会结束 processing 并显示可理解的本地化错误。
  **完成条件：** 每一种错误路径都不会让支付按钮永久禁用或加载。

- [x] **SF-005 — 保护访客购物车免受瞬时故障影响**
  将购物车不存在或已完成，与网络错误、超时、401 和 5xx 分开处理；仅前者能清理 cart cookie，后者必须保留购物车并向用户报告可重试错误。
  **完成条件：** 覆盖 404、completed、网络异常和 5xx 的 action 测试，后两种验证 cookie 未被删除。

- [x] **SF-006 — 使渠道配置实际生效**
  将 `SPREE_CHANNEL_CODE` 映射到 Store API SDK client 的 `channel` 配置，并让所有相关请求携带正确的 `X-Spree-Channel`。
  **完成条件：** config 类型、client 构建和请求头均有测试；未配置时保持默认渠道行为。

- [x] **SF-007 — 将用户令牌传递给目录请求**
  商品和分类的 list、show、过滤与缓存路径均携带认证 token；缓存继续按认证上下文隔离，不能把访客结果泄露给登录用户或相反。
  **完成条件：** 请求 mock 验证 token 被发送；登录目录或客户价格的响应不会被访客缓存复用。

### P2 — Checkout, account, and operations

- [x] **SF-008 — 使用市场国家作为地址默认值**
  新地址默认匹配当前 `/{country}/{locale}` 市场；后端既有地址优先，用户选择仍可覆盖默认值。
  **完成条件：** US、CA 等市场的组件与 E2E 测试验证国家、州和运费请求使用正确国家。

- [x] **SF-009 — 修复州列表竞态**
  异步加载期间正确暴露 pending 状态，开始请求时清空旧州列表，并忽略过期请求结果。
  **完成条件：** 快速切换两个国家不会显示、选择或提交旧国家的州。

- [x] **SF-010 — 支持稀疏规格矩阵选型**
  选项禁用逻辑应依据任意可达变体，而非仅当前完整组合；当切换一个选项需要自动调整另一个选项时，选择可达的有效变体。
  **完成条件：** 红小、蓝大这类稀疏矩阵中的两个有效组合都可从任意初始组合到达。

- [x] **SF-011 — 正确显示部分履约数量与金额**
  履约区块按 manifest 项目数量及分摊金额渲染，不复用订单行的完整数量或总额。
  **完成条件：** 一件订单拆成两次履约时，每个履约只显示自身数量，所有履约合计等于订单数量。

- [x] **SF-012 — 生产环境安全处理邮件配置错误**
  开发环境可保留本地预览；生产环境缺少 Resend 配置必须抛出可重试失败，不写入本地预览文件，也不得确认 webhook 已处理。
  **完成条件：** 开发和生产分支分别有测试；生产缺配置时调用方收到失败。

- [x] **SF-013 — 加固订单追踪入口**
  仅接受解析后协议为 HTTP 或 HTTPS 的追踪 URL；上游查询使用有限超时，匿名接口实施与现有应用兼容的请求节流。
  **完成条件：** 非 HTTP(S) URL 不被渲染为链接；超时与节流路径都有测试且不暴露上游错误细节。

- [x] **SF-014 — 为订单历史提供分页**
  将当前页放入 URL 查询参数，使用 Store API 分页元数据渲染上一页、下一页及可访问的页码状态。
  **完成条件：** 超过 50 个订单时可访问首、中、末页，且刷新或分享 URL 保留页码。

- [x] **SF-015 — 仅上报真实加购**
  购物车 mutation 返回可判别结果；分析事件只在服务端加购已确认后发送，并使用能与商品或变体维度关联的标识符。
  **完成条件：** 失败 mutation 不触发 `add_to_cart`；成功事件的商品、变体、数量和金额可被断言。

- [x] **SF-016 — 让 sitemap 新鲜且可扩展**
  用有失效边界的缓存替换进程永久 Promise 缓存，并按实际 sitemap 分片拉取或生成 URL，避免每个分片构造整个目录。
  **完成条件：** 更新目录后在缓存窗口内反映到 sitemap；大于 50,000 URL 时每个分片只处理自身所需数据。

- [ ] **SF-017 — 在服务端记录政策同意（按官方镜像决策取消）**
  该项需要修改 Spree Core/API 和数据库。相关实现、迁移、SDK 与 OpenAPI 变更已撤回；当前固定官方镜像不会写入政策接受审计记录。

### P3 — Localization and maintainability

- [x] **SF-018 — 消除 Storefront 的英文硬编码**
  将商品和分类 metadata、可访问性文本、支付后备错误及交易邮件迁入全部支持语言的 locale 文件；邮件和 metadata 使用订单或路由 locale。
  **完成条件：** locale parity 通过，中文请求不显示这些英文后备文案，邮件主题和正文随订单 locale 变化。

- [x] **SF-019 — 清理 shadcn 设计系统债务**
  在不改变 CenWatch 视觉设计的前提下，替换原始颜色、手写 Skeleton、非标准表单组合和不一致图标尺寸；改善手写 modal 的焦点陷阱与背景隔离。
  **完成条件：** 受影响组件使用项目 shadcn 组合方式；键盘可在 lightbox 内循环并能 Escape 关闭；视觉回归和可访问性测试通过。

### Review follow-up

- [x] **SF-020 — 在前端统一政策配置并要求显式同意**
  注册、访客结账和快捷支付共用 Storefront 静态政策配置并阻止未勾选提交；调用仍使用官方 SDK 契约，不请求自定义政策接口，也不声明服务端强制同意或持久化能力。

- [x] **SF-021 — 保持官方 API 发布契约不变**
  自定义 SDK、Admin SDK 与 OpenAPI 变更已撤回；Storefront 继续兼容已发布的官方 API/SDK 契约。

- [x] **SF-022 — 保留分页错误并部署共享限流**
  订单历史仅对确认越界的页码跳转，网络、认证和 5xx 原样失败；订单追踪使用共享 Redis 计数器并记录生产所需配置和可信代理头约束。

- [x] **SF-023 — 固化 Storefront 发布与 E2E 供应链**
  本地 E2E 固定使用官方 Spree `5.4.3.1` 镜像，不覆盖 Core/API 运行时代码；第三方 GitHub Actions 固定到不可变提交。

- [x] **SF-024 — 补齐审查发现的 UI 回归**
  覆盖快捷支付政策显示、保存卡整行选择、搜索建议定位和灯箱背景关闭行为。

- [x] **SF-025 — 后端保持官方镜像并接入一键部署**
  生产部署恢复以固定版本 `ghcr.io/spree/spree:5.5.2` 为基础，仅叠加原有 CenWatch 初始化器；Storefront E2E 直接使用官方 `5.4.3.1` 镜像。镜像不再复制 `apps/backend` 或当前 `spree/` 工作树源码。

## Expected Interface Changes

- `SpreeNextConfig` 增加可选渠道字段，并由环境配置提供。
- 购物车和支付 mutation 改为向调用者返回可判别的成功或失败结果，调用者不得从 toast 推断状态。
- 订单历史页接受并验证分页查询参数。
- 政策同意仅由 Storefront 在提交前校验；注册与结账继续使用官方 SDK 契约。

## Verification Matrix

每个任务完成时运行其针对性测试；在 P1、P2、P3 各阶段结束时运行完整 Storefront 验证：

- `pnpm --filter @cenwatch/storefront check`
- `pnpm --filter @cenwatch/storefront typecheck`
- `pnpm --filter @cenwatch/storefront test`
- `pnpm --filter @cenwatch/storefront check:locales`
- `pnpm --filter @cenwatch/storefront build`
- 涉及 UI 行为时运行对应 Playwright E2E；涉及 Store API 或持久化时运行对应 Ruby specs 和类型生成流程。

当前验证状态：

- [x] Storefront Biome、类型检查、Vitest（197 项）与 locale parity
- [x] SDK 类型检查与 Vitest（158 项）
- [x] Storefront production build
- [x] 后端、SDK 与 OpenAPI 自定义扩展已撤回并通过零差异扫描
- [x] 官方 Spree `5.4.3.1` 镜像健康检查与注册政策同意 Playwright E2E
- [ ] 完整 Stripe 支付 E2E（等待同一 sandbox 的测试密钥）

## References

- `docs/plans/cenwatch-storefront-scope.md`
- `docs/plans/storefront-security-fixes.md`
- `docs/plans/5.4-6.0-eu-legal-compliance.md`
