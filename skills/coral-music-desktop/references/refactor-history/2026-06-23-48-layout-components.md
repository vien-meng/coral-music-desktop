# Step 48: Layout Components 迁移

**日期**：2026-06-23
**范围**：将 Vue 布局组件迁移为 React 组件，并集成到 AppShell

## 迁移的组件

### 1. WindowControlBtns.tsx

**对应 Vue 源**：`src/renderer/components/layout/Aside/ControlBtns.vue` + `Toolbar/ControlBtns.vue`

**实现要点**：
- 支持 `variant: 'mac' | 'windows'` 两种风格
- mac 风格：圆形按钮（关闭红色、最小化黄色），hover 时显示图标符号
- windows 风格：矩形按钮，最小化 hover 变灰，关闭 hover 变红
- `isFullscreen` 为 true 时隐藏（与 Vue 版一致）
- 监听 `window focus` 事件清除 hover 状态
- 使用 `appService.closeWindow`/`minWindow` 调用 IPC

### 2. SearchInput.tsx

**对应 Vue 源**：`src/renderer/components/layout/Toolbar/SearchInput.vue`

**实现要点**：
- 使用 Ant Design `AutoComplete` + `Input` 替代 Vue 版的 `material-search-input`
- 绑定 `searchStore.searchText`
- `onSearch` 回调支持路由跳转和搜索文本同步
- 当前为简化版，搜索建议（tipSearch）功能将在 Step 50 完整迁移时增强

### 3. AppShell.tsx 增强

**对应 Vue 源**：`src/renderer/components/layout/Aside/index.vue` + `Toolbar/index.vue` + `View.vue`

**增强内容**：
- 根据 `common.controlBtnPosition` 设置决定窗口控制按钮位置：
  - `left`：mac 风格按钮显示在侧边栏顶部
  - `right`：windows 风格按钮显示在工具栏右侧
- 工具栏集成 `SearchInput` 搜索框
- 全屏模式处理（当前 `isFullscreen` 硬编码为 false，后续接入主进程事件后动态更新）

### 4. appService.ts 增强

新增窗口控制方法：
- `minWindow()`：最小化窗口
- `closeWindow()`：关闭窗口
- `maximizeWindow()`：最大化窗口
- `toggleFullscreen()`：切换全屏

### 5. IPC 契约增强

在 `contracts.ts` 中新增 winMain 通道：
- `close`：关闭窗口
- `min`：最小化窗口
- `max`：最大化窗口
- `fullscreen`：切换全屏

## 验证结果

- `npm run build:renderer`：通过（3284 modules transformed，1.34s）

## 新增/修改文件

- `src/renderer-react/components/layout/WindowControlBtns.tsx`（新增）
- `src/renderer-react/components/layout/SearchInput.tsx`（新增）
- `src/renderer-react/components/layout/index.ts`（新增）
- `src/renderer-react/app/AppShell.tsx`（修改）
- `src/renderer-react/services/appService.ts`（修改）
- `src/shared/ipc/contracts.ts`（修改）
