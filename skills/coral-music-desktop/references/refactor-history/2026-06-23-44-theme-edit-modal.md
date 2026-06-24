# 2026-06-23 Step 44 - ThemeEditModal

## Scope

- Migrated the full theme editor modal with 11 color pickers, background image selection, and dark/preview toggles.
- Integrated the editor into the ThemeSelectorModal with edit/new entry points.

## Completed

### 44.1 ThemeEditModal Component
- Created `src/renderer-react/features/settings/ThemeEditModal.tsx`
- Uses `@simonwep/pickr` (classic theme) for 11 color pickers:
  - Base: primary color, font color, app background, aside font color, main background
  - Badge: primary (lossless), secondary (high quality), tertiary (kw)
  - Control buttons: hide, min, close
- Each picker has preset swatches matching legacy behavior
- Background image selection via `showSelectDialog` + `copyFile` to temp dir
- Background image removal
- Dark theme / dark font / live preview checkboxes
- Theme name input (max 20 chars)
- Save / Save As New / Remove buttons
- Primary color change triggers `createThemeColors` to regenerate derived colors
- Live preview applies CSS variables to `document.documentElement`
- Background image file management: copy to temp, move to data path on save, remove old on change

### 44.2 ThemeSelectorModal Integration
- Added `onEdit` prop to `ThemeSelectorModalProps`
- Added edit button (EditOutlined) to `ThemeSwatch` for custom themes
- Edit button opens `ThemeEditModal` with the selected theme ID
- "新增主题" button in the theme settings section opens `ThemeEditModal` without a theme ID

### 44.3 CSS Styles
- Added `.coral-theme-swatch-edit` style for the edit button (blue, left-positioned)

## Validation

- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Step 45: Automated code review of all Step 39-44 changes.
