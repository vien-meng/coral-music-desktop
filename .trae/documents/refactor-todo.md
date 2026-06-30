# 重构执行 Todo List

## Step 45: 代码审查修复（已完成）

### 45.1 backupService.ts
- [x] 封装 safeSaveLxConfigFile（Promise 包装回调式 fs.writeFile）
- [x] 修复 overwriteListFull 参数类型
- [x] 所有导入/导出函数添加 try/catch
- [x] readCoralConfigFile 返回值类型守卫

### 45.2 ThemeEditModal.tsx
- [x] Pickr change 回调闭包过期（isDark/isDarkFont 用 ref）
- [x] 预览 CSS 关闭时清理
- [x] 临时背景图文件泄漏清理
- [x] buildTheme() 结构匹配 Coral.Theme 类型（themeColors + extInfo）
- [x] 移除死代码（timeouts 数组、pickrRefs）
- [x] 保存操作添加 try/catch

### 45.3 HotKeySection.tsx
- [x] setTimeout 卸载时清理
- [x] MobX 状态变更包裹 runInAction 或移入 store action
- [x] 启用失败回滚
- [x] 移除死代码（inputRef、forceUpdate）

### 45.4 DislikeListModal.tsx
- [x] handleSave 添加 try/catch
- [x] 添加 isSaving state 替代 isHydrating

### 45.5 PlayTimeoutModal.tsx
- [x] handleConfirm 添加 try/catch
- [x] 替换 RegExp.$1 为 match
- [x] parseInt 添加 radix 10

### 45.6 cacheService.ts
- [x] 返回值添加 ?? 0 默认值
- [x] 各方法添加 try/catch 错误处理

### 45.7 验证与记录
- [x] npm run lint
- [x] npm run build
- [x] 记录 refactor-history/2026-06-23-45-code-review-fixes.md
- [x] 更新 component-migration-plan.md

## Step 46: Base Components（已完成）
- [x] VirtualizedList.tsx
- [x] IconButton.tsx
- [x] SliderBar.tsx
- [x] ContextMenu.tsx
- [x] index.ts

## Step 47: Global Plugins（已完成）
- [x] i18nService.ts
- [x] dialogService.ts
- [x] tipsService.ts

## Step 48: Layout Components（已完成）
- [x] WindowControlBtns.tsx
- [x] SearchInput.tsx
- [x] AppShell.tsx 增强
- [x] appService.ts 窗口控制方法
- [x] IPC 契约增强

## Step 49-54: 后续迁移（待执行）
- [ ] Step 49: Player Bar
- [ ] Step 50: Online Routes 收尾
- [ ] Step 51: Local List Routes 收尾
- [ ] Step 52: Download Route 收尾
- [ ] Step 53: Sound Effect
- [ ] Step 54: Workers 与清理
