# Step 47: Global Plugins 迁移

**日期**：2026-06-23
**范围**：将 Vue 全局插件迁移为 React 服务

## 迁移的插件

### 1. i18nService.ts（国际化）

**对应 Vue 源**：`src/renderer/plugins/i18n.ts` + `src/lang/i18n.ts`

**实现要点**：
- 使用 `useSyncExternalStore` 替代 Vue 的 `ref` 响应式机制
- `subscribe`/`getSnapshot` 模式实现语言切换时的组件自动重渲染
- `setLanguage` 更新 `currentLocale` 并通知所有订阅者
- `getMessage` 保持与 Vue 版相同的回退策略（当前语言 → fallbackLocale `zh-cn` → key 本身）
- `fillMessage` 保持 `{key}` 占位符替换逻辑
- 导出 `useI18n` hook（组件内使用）、`t` 函数（组件外使用）、`setLanguage`、`getCurrentLocale`、`availableLocales`
- 复用 `src/lang/index.ts` 已有的语言包数据，无需重复导入

### 2. dialogService.ts（对话框）

**对应 Vue 源**：`src/renderer/plugins/Dialog/Dialog.vue` + `index.js`

**实现要点**：
- 封装 Ant Design `Modal.confirm`/`Modal.info`/`Modal.warning`/`Modal.error`/`Modal.success`
- `confirm(options)` 返回 `Promise<boolean>`（确认 resolve true，取消 resolve false）
- `dialog(options)` 默认 `showCancel: false`（与 Vue 版一致）
- `dialog.confirm` 强制 `showCancel: true`
- `DialogOptions` 接口兼容 Vue 版（`message`/`showCancel`/`cancelButtonText`/`confirmButtonText`/`title`）

### 3. tipsService.ts（提示气泡）

**对应 Vue 源**：`src/renderer/plugins/Tips/Tips.vue` + `index.js`

**实现要点**：
- Vue 版 Tips 是基于鼠标悬停的 tooltip 系统（通过 `aria-label` 自动显示）
- React 版改用 Ant Design `message`（轻量提示）和 `notification`（通知卡片）替代
- `success`/`error`/`info`/`warning`/`loading` 方法封装 `message`
- `notifySuccess`/`notifyError`/`notifyInfo`/`notifyWarning` 方法封装 `notification`
- 原有 `aria-label` tooltip 行为由 Ant Design `Tooltip` 组件在组件层面实现

### 4. SvgIcon（图标）

**对应 Vue 源**：`src/renderer/plugins/SvgIcon/SvgIcon.vue` + `index.js`

**策略**：不创建单独的图标注册服务。React 端直接使用：
- `@ant-design/icons` 提供的标准图标
- 直接 `import` SVG 文件（配合 Vite 的 SVG 导入能力）
- 不再需要 Vue 版的 `require.context` 批量注册和 SVG sprite 机制

## 验证结果

- `npm run build:renderer`：通过（3281 modules transformed，1.43s）

## 新增文件

- `src/renderer-react/services/i18nService.ts`
- `src/renderer-react/services/dialogService.ts`
- `src/renderer-react/services/tipsService.ts`
