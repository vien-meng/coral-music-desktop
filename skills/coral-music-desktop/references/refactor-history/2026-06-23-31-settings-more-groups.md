# 2026-06-23 Step 31 - Settings More Groups

## Scope

- Continued the React migration for the Settings route.
- Reduced repeated settings JSX and added more persisted settings groups.

## Completed

- Added reusable settings UI primitives inside `SettingsRoutePanel`:
  - `SettingSection`
  - `SettingSwitch`
- Rewired the existing common/play/list/download controls through those primitives.
- Added first React controls for:
  - Search settings
  - Update settings
  - Network proxy settings
  - OpenAPI settings
- Added CSS width constraints for settings text inputs.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Port play-detail and desktop-lyric settings groups.
- Map sync, user API, and theme modal service boundaries before migrating those settings.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
