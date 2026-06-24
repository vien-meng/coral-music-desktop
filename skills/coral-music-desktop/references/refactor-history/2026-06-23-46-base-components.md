# Step 46: Base Components 迁移

**日期**：2026-06-23
**范围**：将 Vue 基础组件迁移为 React/Ant Design 等价物

## 迁移的组件

### 1. VirtualizedList.tsx（核心组件）

**对应 Vue 源**：`src/renderer/components/base/VirtualizedList.vue`

**功能**：高性能虚拟化列表组件，根据 `scrollTop` 和 `itemHeight` 计算可见区域，只渲染可见项。

**实现要点**：
- 使用 `forwardRef` + `useImperativeHandle` 暴露 `scrollTo`/`scrollToIndex`/`getScrollTop` 方法
- `createList` 使用缓存数组避免重复创建视图对象
- `updateView` 使用 `requestAnimationFrame` 在下一帧更新视图
- 滚动时设置 `pointer-events: none` 提升性能，200ms 防抖后恢复
- `animateScroll` 使用 `easeInOutQuad` 缓动函数实现平滑滚动
- 支持取消滚动（`cancelScrollRef`）
- 泛型设计：`VirtualizedList<T>` 支持任意列表项类型
- `renderItem` 回调替代 Vue 的作用域插槽
- `renderFooter` 回调替代 Vue 的 footer 插槽

### 2. IconButton.tsx

**对应 Vue 源**：`src/renderer/components/base/Btn.vue`

**实现**：封装 Ant Design `Button`，支持 `min`（small size）和 `outline`（ghost）变体。

### 3. SliderBar.tsx

**对应 Vue 源**：`src/renderer/components/base/SliderBar.vue`

**功能**：可拖拽滑动条，支持鼠标拖拽和点击定位。

**实现要点**：
- 使用 `useRef` 存储拖拽状态（`isMsDown`/`msDownX`/`msDownRatio`）
- `document` 级别的 `mousemove`/`mouseup` 监听实现全局拖拽
- `getSteppedValue` 处理步进值
- 进度条使用百分比宽度（替代 Vue 的 `scaleX` 变换，更直观）
- 主题化：使用 CSS 变量 `--color-primary`、`--color-primary-light-100-alpha-100`

### 4. ContextMenu.tsx

**对应 Vue 源**：`src/renderer/components/base/Menu.vue` + `Popup.vue`

**实现**：封装 Ant Design `Dropdown`，支持 `contextMenu`/`click`/`hover` 触发方式。`MenuItem` 接口与 Vue 版兼容（`action`/`name`/`hide`/`disabled`）。

### 5. index.ts

统一导出所有基础组件，方便导入。

## 未迁移的组件（直接使用 Ant Design）

以下 Vue 组件无需创建 React 等价物，直接使用 Ant Design 对应组件：

| Vue 组件 | Ant Design 替代 |
|----------|-----------------|
| `Checkbox.vue` | `Checkbox` / `Radio.Group` |
| `Selection.vue` | `Select` |
| `Tab.vue` | `Tabs` |
| `Input.vue` | `Input` |
| `Popup.vue`（气泡） | `Popover` / `Tooltip` |

## 验证结果

- `npm run build:renderer`：通过（3281 modules transformed，1.41s）

## 新增文件

- `src/renderer-react/components/base/VirtualizedList.tsx`
- `src/renderer-react/components/base/IconButton.tsx`
- `src/renderer-react/components/base/SliderBar.tsx`
- `src/renderer-react/components/base/ContextMenu.tsx`
- `src/renderer-react/components/base/index.ts`
