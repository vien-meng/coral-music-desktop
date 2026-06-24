# 珊瑚音乐重构：代码审查修复与后续迁移计划

## 当前状态

Step 39-44 已完成（DislikeListModal、PlayTimeoutModal、SettingOther、SettingAbout、SettingBackup、SettingHotKey、ThemeEditModal 均已迁移）。Step 45 自动代码审查已执行，发现 38 个问题，其中 2 个已修复（timeoutStopService 秒数校验、hotKeyService 的 `isMac` 替换）。本计划完成剩余修复并规划后续迁移批次。

---

## 第一部分：Step 45 代码审查修复（剩余项）

### 1. backupService.ts — 关键修复

**问题 1（严重）**：`saveLxConfigFile`（位于 `@common/utils/nodejs.ts:148`）使用回调式 `fs.writeFile`，不返回 Promise，调用方 `await` 无效。

- **策略**：不修改共享的 `@common/utils/nodejs.ts`（遗留代码，影响面大），在 `backupService.ts` 内部封装一个 `safeSaveLxConfigFile` wrapper，用 `Promise` + 回调包装，确保写入完成或失败后再 resolve/reject。

**问题 2**：`overwriteListFull` 调用参数字段名错误。
- `backupService.ts:50` 和 `:72` 使用 `{ defaultList, loveList, userList: allLists }`，但 `ListDataFull` 类型要求 `userList: UserListInfoFull[]`（含 `list` 属性）。
- `BackupListInfo` 已有 `list` 字段，结构兼容，但需确认 `UserListInfoFull` 的额外字段（`source`、`sourceListId`、`locationUpdateTime`）类型匹配。
- **修复**：确保 `allLists` 中 user list 项包含 `locationUpdateTime: number | null`（当前用 `?? null`，类型正确）。

**问题 3**：所有导入/导出函数缺少 try/catch。
- **修复**：在 `importAllData`、`exportAllData`、`importSetting`、`exportSetting`、`importPlayList`、`exportPlayList`、`exportPlayListToText`、`exportPlayListToCsv` 中包裹 try/catch，失败时通过 Ant Design `message.error` 提示用户。

**问题 4**：`readLxConfigFile` 返回 `any`，缺少类型安全。
- **修复**：在 `backupService` 中为 `readLxConfigFile` 返回值添加类型断言/守卫，区分 `allData`/`allData_v2`/`setting`/`playList` 等格式。

### 2. ThemeEditModal.tsx — 多项修复

**问题 1（主要）**：Pickr `change` 回调闭包过期。
- `useEffect`（创建 pickr）依赖数组为 `[open]`，但 `change` 回调内引用 `isDark`/`isDarkFont`，这两个值在首次创建后不再更新。
- **修复**：用 `useRef` 存储 `isDarkRef`/`isDarkFontRef`，在 `change` 回调中读取 ref 当前值；或在 `isDark`/`isDarkFont` 变化时同步更新 ref。

**问题 2（主要）**：预览 CSS 未在关闭时清理。
- `applyPreviewTheme` 直接设置 `document.documentElement.style` 的 CSS 变量，关闭模态框后残留。
- **修复**：在 `onClose` 或 `open` 变为 `false` 时，恢复原始主题颜色（保存 `originalThemeRef` 对应的 CSS 变量快照，关闭时还原；或调用 `themeService` 重新应用当前主题）。

**问题 3（主要）**：临时背景图文件泄漏。
- `handleSelectBgImg` 将文件复制到 temp 目录存入 `tempBgRef.current`，若用户关闭不保存，文件残留。
- **修复**：在模态框关闭（`open` 变 `false`）的 `useEffect` 清理函数中，若 `tempBgRef.current` 存在且未被 move（即未保存），调用 `removeFile` 清理。

**问题 4（主要）**：`buildTheme()` 返回结构与 `LX.Theme` 类型不匹配。
- 类型要求 `config: { themeColors: ThemeColors, extInfo: { ... } }`，但当前代码将所有颜色（含 badge/btn/background）放入 `themeColors`，且 `--background-image` 直接挂在 `config` 下。
- **修复**：在 `buildTheme()` 中将颜色分类：`createThemeColors` 返回的派生色 + `--color-primary` + `--color-1000` 放入 `themeColors`；`--color-app-background`、`--color-main-background`、`--color-nav-font`、`--background-image`、`--color-badge-*`、`--color-btn-*` 放入 `extInfo`。
- **注意**：需同步修改 `useEffect` 中读取 `editingTheme.config.themeColors` 的逻辑，改为从 `themeColors` + `extInfo` 合并读取。

**问题 5（次要）**：死代码。
- `timeouts` 数组声明但无 `setTimeout` 推入，清理逻辑无效。
- `pickrRefs` 被赋值但从未读取。
- **修复**：移除 `timeouts` 数组及其清理逻辑；移除 `pickrRefs`（用局部 `pickrs` 数组管理即可）。

**问题 6（次要）**：保存操作缺少错误处理。
- `handleSave`/`handleSaveNew` 中 `moveFile`/`copyFile`/`removeFile`/`saveUserTheme` 未 try/catch。
- **修复**：包裹 try/catch，失败时 `message.error` 提示并阻止关闭。

### 3. HotKeySection.tsx — 多项修复

**问题 1（主要）**：`setTimeout` 未在卸载时清理。
- `handleFocus`/`handleBlur` 内 `setTimeout` 回调可能在组件卸载后执行。
- **修复**：用 `useRef` 存储 timeout ID，在组件卸载 `useEffect` 清理函数中 `clearTimeout`。

**问题 2（主要）**：MobX 状态变更未包裹 `runInAction`。
- `handleEnableGlobal`/`handleEnableLocal` 中 `hotKeyStore.config.global.enable = checked` 在 async 函数中直接赋值。
- `handleBlur` 中 `delete hotKeyStore.config[type].keys[config.key]` 等直接变异。
- **修复**：将 store 的状态变更逻辑移入 `HotKeyStore` 的 action 方法（如 `setEnable`、`updateKey`），在 action 内自动被 MobX 追踪；或在 async 回调中用 `runInAction` 包裹。

**问题 3（次要）**：启用失败无回滚。
- `handleEnableGlobal` 先设 `enable = checked`，再调 IPC，若 IPC 失败，本地状态已变。
- **修复**：先调 IPC，成功后再更新本地状态；或失败时回滚 `enable` 值。

**问题 4（次要）**：死代码。
- `inputRef` 声明并传入 `Input` 但从未使用其方法。
- `forceUpdate` / `_` state 是强制刷新 hack。
- **修复**：移除 `inputRef`；移除 `forceUpdate`（MobX observer 应自动响应 store 变更，若不响应说明 store 变更未在 action 中）。

### 4. DislikeListModal.tsx — 修复

**问题 1（次要）**：`handleSave` 缺少 try/catch。
- **修复**：包裹 try/catch，失败时 `message.error`。

**问题 2（次要）**：`loading={dislike.isHydrating}` 语义错误。
- `isHydrating` 是初始水合状态，非保存操作状态。
- **修复**：添加本地 `isSaving` state，`handleSave` 开始时设 `true`，结束（无论成功失败）设 `false`，绑定到 `loading`。

### 5. PlayTimeoutModal.tsx — 修复

**问题 1（次要）**：`handleConfirm` 缺少 try/catch。
- **修复**：包裹 try/catch，失败时 `message.error`。

**问题 2（次要）**：`RegExp.$1` 已废弃。
- **修复**：改用 `text.match(RXP)?.[1]`。

**问题 3（次要）**：`parseInt(text)` 缺少 radix。
- **修复**：改为 `parseInt(text, 10)`。

### 6. cacheService.ts — 修复

**问题 1（次要）**：返回值未校验。
- `getCacheSize` 等可能返回 `undefined`。
- **修复**：添加 `?? 0` 默认值。

**问题 2（次要）**：缺少错误处理。
- **修复**：在各方法中包裹 try/catch，失败时返回默认值（数字返回 0，void 返回）并 `console.error`。

---

### Step 45 验证

修复完成后执行：
1. `npm run lint`
2. `npm run build:renderer`
3. `npm run build`
4. 记录 `skills/coral-music-desktop/references/refactor-history/2026-06-23-45-code-review-fixes.md`
5. 更新 `component-migration-plan.md` 的 "Current Next Batch" 部分

---

## 第二部分：后续迁移计划（Step 46+）

Settings 路由（Step 13）即将全部完成。后续按依赖顺序推进：

### Step 46: Base Components 迁移（Step 5）

**目标**：将 Vue 基础组件替换为 React/Ant Design 等价物。

- `Btn.vue` → `IconButton.tsx` + Ant Design `Button`
- `Checkbox.vue` → Ant Design `Checkbox`
- `Selection.vue` → Ant Design `Select`
- `SliderBar.vue` → Ant Design `Slider`（播放器进度条需自定义）
- `Tab.vue` → Ant Design `Tabs`
- `Popup.vue` / `Menu.vue` → Ant Design `Dropdown` / `Popover` / `Menu`
- `VirtualizedList.vue` → 自定义 React 虚拟列表
- `MusicList.vue` → React 音乐列表组件

### Step 47: Global Plugins 迁移（Step 6）

**目标**：替换 Vue 全局插件。

- `plugins/i18n.ts` → React i18n service/hook
- `plugins/Dialog/Dialog.vue` → Ant Design `Modal` service
- `plugins/Tips/Tips.vue` → Ant Design `message` / `notification`
- `plugins/SvgIcon/SvgIcon.vue` → React 图标注册

### Step 48: Layout Components 迁移（Step 7）

**目标**：重建应用外壳。

- Sidebar: `Aside/index.vue`、`Aside/NavBar.vue`、`Aside/ControlBtns.vue`
- Toolbar: `Toolbar/index.vue`、`Toolbar/SearchInput.vue`、`Toolbar/ControlBtns.vue`
- `View.vue` 主视图包装器
- 全局模态框: `PactModal`、`UpdateModal`、`ChangeLogModal`、`SyncModeModal`、`SyncAuthCodeModal`

### Step 49: Player Bar 迁移（Step 8）

**目标**：迁移最高风险的常驻 UI。

- `PlayBar/*`、`ProgressBar.vue`、`VolumeBtn.vue`、`PlaybackRateBtn.vue`、`TogglePlayModeBtn.vue`
- `PlayDetail/*`、`LyricMenu.vue`、`MusicComment/*`

### Step 50: Online Routes 完整迁移（Step 10 收尾）

**目标**：完成搜索/歌单/排行榜的完整 Vue → React 替换。

- `views/Search/index.vue` + `MusicList` + `SongListList` + `BlankView`
- `views/songList/List/index.vue` + `ListView` + `components/*`
- `views/songList/Detail/index.vue`
- `views/Leaderboard/index.vue` + `BoardList` + `MusicList`

### Step 51: Local List Routes 完整迁移（Step 11 收尾）

**目标**：完成本地列表的完整迁移。

- 拖拽排序、移动到列表、右键菜单、重复检测
- `useList`、`useMenu`、`useMusicActions`、`useMusicAdd`、`useMusicDownload`、`useMusicToggle`、`usePlay`、`useSearch`、`useSort`

### Step 52: Download Route 完整迁移（Step 12 收尾）

**目标**：完成下载工作流。

- 下载启动/暂停/更新、本地文件系统操作
- `DownloadModal.vue`、`DownloadMultipleModal.vue`

### Step 53: Sound Effect 迁移（Step 14）

**目标**：迁移音频特效控件。

- `AudioVisualizer.vue`、`SoundEffectBtn/*`（BiquadFilter、AudioConvolution、AudioPanner、PitchShifter、预设管理）

### Step 54: Workers 与清理（Step 15）

**目标**：移除遗留 Vue 源码。

- 将 `src/renderer/worker` 迁移到 `src/renderer-react/workers` 或 `src/shared/workers`
- 移除 `vueTools.ts`、`vueRouter.ts`、`shims_vue.d.ts`
- 逐批删除 `.vue` 文件
- 最终移除 `src/renderer` 和 `src/renderer-lyric` 目录

---

## 第三部分：自动代码审查集成

在每个 Step 完成后，自动执行代码审查：

1. **审查触发**：每个 Step 的 `lint + build` 通过后，自动调用 TRAE-code-review skill
2. **审查范围**：该 Step 涉及的所有新增/修改文件
3. **审查流程**：
   - 收集 `git diff` 获取改动
   - 派遣 2 个子代理并行验证
   - 汇总问题表格
   - 自动修复所有问题（根据用户要求"不用问确认，直接采纳并执行"）
4. **记录**：审查结果记录到对应 Step 的 refactor-history 文件

---

## 执行顺序

```
Step 45（代码审查修复）→ Step 46（Base Components）→ Step 47（Plugins）→ Step 48（Layout）→ Step 49（Player Bar）→ Step 50-52（Routes 收尾）→ Step 53（Sound Effect）→ Step 54（Cleanup）
```

每个 Step 完成后：
1. `npm run lint` + `npm run build`
2. 自动代码审查 + 修复
3. 记录 refactor-history
4. 更新 component-migration-plan.md
