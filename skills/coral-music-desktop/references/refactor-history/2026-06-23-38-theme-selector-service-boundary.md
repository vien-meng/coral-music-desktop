# 2026-06-23 Step 38 - Theme Selector Service Boundary

## Scope

- Mapped the theme selector service boundary for the React Settings route.
- Added the first React theme selector modal with light/dark theme grouping, selection, and user-theme removal.
- Extended ThemeStore with computed theme lists and theme ID selection actions.

## Completed

- Extended `ThemeStore` with:
  - `allThemes` computed (built-in + user themes)
  - `lightThemes` and `darkThemes` computed (filtered by `isDark`)
  - `setLightThemeId()` action that persists `theme.lightId`
  - `setDarkThemeId()` action that persists `theme.darkId`
  - `removeUserTheme()` action that calls IPC and updates local cache
  - `saveUserTheme()` action that calls IPC and updates local cache
- Added a new "主题" (Theme) settings section with:
  - theme mode radio (light/dark) bound to `theme.themeMode`
  - theme selector button that opens the `ThemeSelectorModal`
  - light/dark theme count summary
- Added `ThemeSelectorModal` component with:
  - light and dark theme groups
  - color swatch per theme using `--color-theme` primary color
  - active state for current `theme.lightId` / `theme.darkId`
  - remove button for custom user themes
- Added `ThemeSwatch` sub-component with keyboard-accessible click handling
- Added CSS styles for theme selector swatches, active states, and remove buttons

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Port theme editor modal (color pickers, background image, badge/control-button colors).
- Port backup, hotkey, and about settings where service boundaries already exist.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
