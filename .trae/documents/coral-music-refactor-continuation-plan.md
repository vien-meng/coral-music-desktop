# 珊瑚音乐重构后续计划与自动代码审查

## 当前状态总结

项目已完成 Step 1-38 的重构工作（详见 `skills/coral-music-desktop/references/refactor-history/`）。当前 Settings 路由面板已有 14 个设置区域（主题/基础/播放/播放详情/桌面歌词/列表/下载/搜索/更新/网络/ODC/同步/OpenAPI/User API），桌面歌词渲染器已完整迁移，在线音乐搜索/歌单/排行榜已有预览面板。

### 待迁移项（按优先级排序）

根据 `component-migration-plan.md` 的 "Current Next Batch" 和 Step 13 未完成项：

1. **ThemeEditModal**（主题编辑器）- 11 个颜色选择器 + 背景图 + 深色/预览开关
2. **DislikeListModal**（不感兴趣列表编辑）- 规则文本编辑
3. **PlayTimeoutModal**（定时停止播放）- 倒计时 + 等待播放结束
4. **SettingOther**（其他设置）- 透明窗口/托盘主题/缓存清理/清空歌单
5. **SettingAbout**（关于）- 信息展示 + 许可协议入口
6. **SettingBackup**（备份）- 列表/设置/全量数据导入导出
7. **SettingHotKey**（快捷键）- 本地/全局快捷键绑定

---

## 执行计划

### Step 39: DislikeListModal + PlayTimeoutModal（简单模态框批次）

**目标**：迁移两个相对简单的设置模态框，复用已有的 DislikeStore 和 PlayerStore。

#### 39.1 DislikeListModal 迁移
- **文件**：`src/renderer-react/features/settings/DislikeListModal.tsx`
- **依赖**：`DislikeStore`（已存在 `overwriteDislikeMusicInfos` action）
- **实现**：
  - Ant Design `Modal` + `Input.TextArea`
  - 打开时同步 `dislikeStore.dislikeInfo.rules` 到本地 state
  - 保存时调用 `dislikeStore.overwriteDislikeMusicInfos(rules)`
  - 在 SettingsRoutePanel "其他" 区域或单独入口添加打开按钮
- **验证**：lint + build

#### 39.2 PlayTimeoutModal 迁移
- **文件**：`src/renderer-react/features/settings/PlayTimeoutModal.tsx`
- **依赖**：需新建 `timeoutStopService`（封装 `startTimeoutStop`/`stopTimeoutStop`/`useTimeout`）
- **实现**：
  - Ant Design `Modal` + `InputNumber`（1-1440 分钟）+ `Checkbox`（等待播放结束）
  - 倒计时显示（格式化 hh:mm:ss）
  - 按钮文案动态切换（停止/更新 vs 关闭/确认）
  - 在 SettingsRoutePanel "播放" 区域添加打开按钮
- **新增服务**：`src/renderer-react/services/timeoutStopService.ts`
  - `startTimeoutStop(seconds)` / `stopTimeoutStop()` / `getTimeoutLabel()`
- **验证**：lint + build

---

### Step 40: SettingOther（其他设置 - 缓存清理与杂项）

**目标**：迁移透明窗口、托盘主题、各类缓存清理、清空歌单。

#### 40.1 IPC 契约扩展
- 在 `contracts.ts` 添加缓存相关通道：
  - `getCacheSize` / `clearCache`
  - `getOtherSourceCount` / `clearOtherSource`
  - `getMusicUrlCount` / `clearMusicUrl`
  - `getLyricRawCount` / `clearLyricRaw`
  - `getLyricEditedCount` / `clearLyricEdited`
  - `showSaveDialog`
- 确认主进程 `rendererEvent/app.ts` 和 `rendererEvent/music.ts` 已有处理（已确认存在）

#### 40.2 新建 cacheService
- **文件**：`src/renderer-react/services/cacheService.ts`
- 封装上述 10 个缓存查询/清理方法 + `showSaveDialog`

#### 40.3 SettingOther 区域实现
- 在 SettingsRoutePanel 添加 "其他" `SettingSection`
- **透明窗口**：`Switch` 绑定 `common.transparentWindow`
- **托盘主题**：`Radio.Group`（native/black/origin/auto）绑定 `tray.themeId`
- **缓存清理**：6 个缓存项，每项显示数量 + 清理按钮（带 `Popconfirm`）
- **清空歌单**：`Popconfirm` + 调用 `listStore` 清空方法
- **DislikeList 入口**：显示规则数 + 打开 DislikeListModal 按钮
- **验证**：lint + build

---

### Step 41: SettingAbout（关于页面）

**目标**：迁移关于信息展示和许可协议入口。

#### 41.1 实现关于区域
- 在 SettingsRoutePanel 添加 "关于" `SettingSection`
- 展示开源地址、下载地址、文档链接、Issue 链接
- 使用 `appService.openUrl()` 打开外链（已存在）
- "许可协议" 按钮触发 `uiStore.isShowPact = true`（需确认 UiStore 是否有此字段）
- **验证**：lint + build

---

### Step 42: SettingBackup（备份与导入导出）

**目标**：迁移列表/设置/全量数据的导入导出功能。

#### 42.1 依赖分析
- 需要 worker 通道：`readLxConfigFile` / `saveLxConfigFile` / `exportPlayListToText` / `exportPlayListToCSV`
- 需要 `showSelectDialog`（已存在）+ `showSaveDialog`（Step 40 添加）
- 需要 `listStore` 的 `getListMusics` / `overwriteListFull` / `overwriteListMusics`
- 需要 `migrateSetting` 工具（`@common/utils/migrateSetting`）
- 需要 `toNewMusicInfo` / `fixNewMusicInfoQuality`（`@renderer/utils`）

#### 42.2 实现
- 在 SettingsRoutePanel 添加 "备份" `SettingSection`
- 三组按钮：部分备份（导入/导出播放列表、导入/导出设置）、全量备份（导入/导出全部）、其他导出（导出为文本/CSV）
- 导入时兼容新旧格式 + 设置迁移
- 导入设置后强制 `common.isAgreePact = false`
- **验证**：lint + build

---

### Step 43: SettingHotKey（快捷键设置）

**目标**：迁移本地/全局快捷键绑定。

#### 43.1 IPC 契约扩展
- 在 `contracts.ts` 添加 hotkey 通道：
  - `hotKeySetEnable` / `hotKeySetConfig` / `hotKeyGetStatus`
- 确认主进程 `rendererEvent/hotKey.ts` 已有处理（已确认存在）

#### 43.2 新建 hotKeyService
- **文件**：`src/renderer-react/services/hotKeyService.ts`
- 封装 `setEnable` / `setConfig` / `getStatus` + `allHotKeys` 常量

#### 43.3 实现
- 在 SettingsRoutePanel 添加 "快捷键" `SettingSection`
- 本地快捷键组：`Switch` 启用 + 按键录入输入框
- 全局快捷键组：`Switch` 启用 + 按键录入 + 注册失败删除线样式
- 录入时监听 keydown 事件，格式化按键名
- **验证**：lint + build

---

### Step 44: ThemeEditModal（主题编辑器 - 复杂批次）

**目标**：迁移完整的主题编辑器，包含 11 个颜色选择器和背景图。

#### 44.1 依赖准备
- `@simonwep/pickr` 已在 package.json（已确认）
- `createThemeColors` 在 `src/common/theme/utils.js`（CommonJS，需适配）
- `copyFile` / `moveFile` / `removeFile` / `joinPath` / `extname` / `basename` / `checkPath` / `createDir` 在 `@common/utils/nodejs`
- `encodePath` / `isUrl` 在 `@common/utils/common`

#### 44.2 实现
- **文件**：`src/renderer-react/features/settings/ThemeEditModal.tsx`
- 11 个 `@simonwep/pickr` 颜色选择器（主色/字体/背景/侧栏字体/主背景/3徽章/3控制按钮）
- 背景图选择（`showSelectDialog` + `copyFile`）
- 深色/深色字体/实时预览开关
- 主题名输入（最长 20 字符）
- 保存/另存为/删除按钮
- 主色变化时通过 `createThemeColors` 联动刷新派生颜色
- 在 ThemeSelectorModal 添加 "编辑" / "新增" 入口
- **验证**：lint + build

---

### Step 45: 自动代码审查

**目标**：对 Step 39-44 的所有改动执行结构化代码审查。

#### 审查流程（遵循 TRAE-code-review 技能）
1. **确定审查范围**：`git diff` 获取 Step 39-44 的所有未提交改动
2. **上下文收集**：读取相关源码和设计文档
3. **推断作者意图**：分析改动模式
4. **Mermaid 图表**：生成业务流程图和技术流程图
5. **扫描问题**：检查代码质量、正确性、最佳实践
6. **交叉验证**：派遣 2 个子代理并行验证所有问题
7. **输出结果**：表格形式呈现问题 + 代码链接
8. **修复选择**：使用 AskUserQuestion 让用户选择修复项（但根据用户要求"不用问确认，直接采纳并执行"，将自动修复所有问题）

#### 审查重点
- IPC 契约类型安全性
- MobX store action 的错误处理
- 服务层的 `isElectronRenderer` 守卫
- Ant Design 组件使用规范性
- 内存泄漏（disposer 清理）
- 类型导入（`import type`）
- 与遗留代码的兼容性

---

## 每步完成后的记录要求

每个 Step 完成后：
1. 在 `skills/coral-music-desktop/references/refactor-history/` 创建 `2026-06-23-XX-<step-name>.md`
2. 更新 `component-migration-plan.md` 中对应项的 `[x]` 标记
3. 更新 "Current Next Batch" 部分

## 验证标准

每个 Step 必须通过：
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## 执行顺序

Step 39 → Step 40 → Step 41 → Step 42 → Step 43 → Step 44 → Step 45（自动审查）

按从简单到复杂的顺序推进，确保每步可独立验证。
