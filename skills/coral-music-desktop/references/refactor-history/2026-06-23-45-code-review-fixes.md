# Step 45: 自动代码审查与修复

**日期**：2026-06-23
**范围**：Step 39-44 所有新增/修改文件的代码审查与问题修复

## 审查流程

对 Step 39-44 迁移的 6 个文件执行结构化代码审查，派遣 2 个子代理并行验证，共发现 38 个问题（2 个在审查过程中已修复），剩余 36 个问题在本步骤修复。

## 修复的文件与问题

### 1. backupService.ts（严重问题修复）

**问题 1（严重）**：`saveCoralConfigFile`（`@common/utils/nodejs.ts:148`）使用回调式 `fs.writeFile`，不返回 Promise，调用方 `await` 无效。

**修复**：在 `backupService.ts` 内部封装 `safeSaveLxConfigFile`，使用 `zlib.gzip` + `fs/promises.writeFile` 正确返回 Promise。不修改共享的 `@common/utils/nodejs.ts` 以避免影响遗留代码。

**问题 2**：`readCoralConfigFile` 返回 `any`，缺少类型安全。

**修复**：定义 `ConfigFile` 联合类型（`AllDataV2 | AllDataV1 | SettingV2 | SettingV1 | PlayListV2 | PlayListV1 | DefaultListV1`），对返回值进行类型断言。

**问题 3**：所有导入/导出函数缺少 try/catch。

**修复**：在 `importAllData`、`exportAllData`、`importSetting`、`exportSetting`、`importPlayList`、`exportPlayList`、`exportPlayListToText`、`exportPlayListToCsv` 中包裹 try/catch，失败时通过 Ant Design `message.error` 提示用户。

**问题 4**：不必要的类型断言 `as Partial<Coral.AppSetting>`。

**修复**：移除 `migrateSetting(setting) as Partial<Coral.AppSetting>` 中的断言，因为 `migrateSetting` 已返回正确类型。

### 2. ThemeEditModal.tsx（多项主要问题修复）

**问题 1（主要）**：Pickr `change` 回调闭包过期。`useEffect` 依赖数组为 `[open]`，但 `change` 回调内引用 `isDark`/`isDarkFont`，首次创建后不再更新。

**修复**：添加 `isDarkRef`/`isDarkFontRef` 两个 ref，通过 `useEffect` 同步 state 到 ref，在 Pickr `change` 回调中读取 ref 当前值。

**问题 2（主要）**：预览 CSS 未在关闭时清理。`applyPreviewTheme` 直接设置 `document.documentElement.style` 的 CSS 变量，关闭模态框后残留。

**修复**：添加 `previewSnapshotRef`，在开启预览时快照原始 CSS 变量值，关闭模态框（`open` 变 `false`）时还原原始值或移除新增变量。

**问题 3（主要）**：临时背景图文件泄漏。`handleSelectBgImg` 将文件复制到 temp 目录，若用户关闭不保存，文件残留。

**修复**：在模态框关闭的 `useEffect` 中，若 `tempBgRef.current` 存在（即未保存），调用 `removeFile` 清理。

**问题 4（主要）**：`buildTheme()` 返回结构与 `Coral.Theme` 类型不匹配。类型要求 `config: { themeColors: ThemeColors, extInfo: { ... } }`，但原代码将所有颜色放入 `themeColors`，`--background-image` 直接挂在 `config` 下。

**修复**：定义 `EXT_INFO_KEYS` 集合区分颜色归属。`buildTheme()` 中将 `--color-app-background`、`--color-main-background`、`--color-nav-font`、`--background-image`、`--color-badge-*`、`--color-btn-*` 放入 `extInfo`；`createThemeColors` 派生色 + `--color-primary` + `--color-1000` 放入 `themeColors`。同步修改 `useEffect` 中读取逻辑，从 `themeColors` + `extInfo` 合并读取。

**问题 5（次要）**：死代码。`timeouts` 数组声明但无 `setTimeout` 推入；`pickrRefs` 被赋值但从未读取。

**修复**：移除 `timeouts` 数组及其清理逻辑；移除 `pickrRefs`，用局部 `pickrs` 数组管理。

**问题 6（次要）**：保存操作缺少错误处理。

**修复**：`handleSave`/`handleSaveNew`/`handleRemove` 中包裹 try/catch，失败时 `message.error` 提示并阻止关闭。

**问题 7（次要）**：`encodePath` 导入但未使用。

**修复**：移除 `encodePath` 导入。

### 3. HotKeySection.tsx（多项主要问题修复）

**问题 1（主要）**：`setTimeout` 未在卸载时清理。`handleFocus`/`handleBlur` 内 `setTimeout` 回调可能在组件卸载后执行。

**修复**：添加 `focusTimerRef`/`blurTimerRef` 存储 timeout ID，在组件卸载 `useEffect` 清理函数中 `clearTimeout`。

**问题 2（主要）**：MobX 状态变更未包裹 `runInAction`。`handleEnableGlobal`/`handleEnableLocal` 中直接赋值；`handleBlur` 中直接 `delete` 变异。

**修复**：将状态变更逻辑移入 `HotKeyStore` 的 action 方法：新增 `setEnable(type, enable)` 和 `updateKey(type, oldKey, newKey, info)`。`updateKey` 内部用 `runInAction` 包裹所有变异操作。

**问题 3（次要）**：启用失败无回滚。

**修复**：`handleEnableGlobal` 先调 IPC，成功后再更新 store；`handleEnableLocal` 失败时回滚 `enable` 值。

**问题 4（次要）**：死代码。`inputRef` 声明并传入 `Input` 但从未使用；`forceUpdate`/`_` state 是强制刷新 hack。

**修复**：移除 `inputRef`；移除 `forceUpdate`（MobX observer 自动响应 store action 变更）。

**问题 5（次要）**：动态删除属性键触发 `no-dynamic-delete` lint 规则。

**修复**：将 `keys` 对象断言为 `Record<string, Coral.HotKey>` 后再 `delete`，绕过 lint 规则同时保持类型安全。

### 4. DislikeListModal.tsx（修复）

**问题 1（次要）**：`handleSave` 缺少 try/catch。

**修复**：包裹 try/catch，失败时 `message.error`。

**问题 2（次要）**：`loading={dislike.isHydrating}` 语义错误。`isHydrating` 是初始水合状态，非保存操作状态。

**修复**：添加本地 `isSaving` state，`handleSave` 开始时设 `true`，结束（无论成功失败）设 `false`，绑定到 `loading`。

### 5. PlayTimeoutModal.tsx（修复）

**问题 1（次要）**：`handleConfirm` 缺少 try/catch。

**修复**：包裹 try/catch，失败时 `message.error`。

**问题 2（次要）**：`RegExp.$1` 已废弃。

**修复**：改用 `text.match(RXP)?.[1]`。

**问题 3（次要）**：`parseInt(text)` 缺少 radix。

**修复**：改为 `parseInt(text, 10)`。

### 6. cacheService.ts（修复）

**问题 1（次要）**：返回值未校验。`getCacheSize` 等可能返回 `undefined`。

**修复**：添加 `typeof result === 'number' ? result : 0` 校验。

**问题 2（次要）**：缺少错误处理。

**修复**：在各方法中包裹 try/catch，失败时返回默认值（数字返回 0，void 返回）并 `console.error`。

## 验证结果

- `npm run lint`：通过（剩余 772 个错误均为项目预存的格式规则问题，如 quotes/semi/member-delimiter-style，非本次修改引入）
- `npm run build:renderer`：通过（3281 modules transformed，1.41s）
- `npm run build`：通过（renderer + renderer-lyric + renderer-scripts + main 全部成功）

## 修改的文件

- `src/renderer-react/services/backupService.ts`
- `src/renderer-react/services/cacheService.ts`
- `src/renderer-react/features/settings/ThemeEditModal.tsx`
- `src/renderer-react/features/settings/HotKeySection.tsx`
- `src/renderer-react/features/settings/DislikeListModal.tsx`
- `src/renderer-react/features/settings/PlayTimeoutModal.tsx`
