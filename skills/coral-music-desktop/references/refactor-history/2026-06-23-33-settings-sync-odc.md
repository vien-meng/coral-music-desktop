# 2026-06-23 Step 33 - Settings Sync And ODC

## Scope

- Continued the React migration for the Settings route.
- Added direct persisted ODC settings and basic sync settings.

## Completed

- Added first React controls for `SettingOdc.vue`:
  - auto-clear search input
  - auto-clear search result list
- Added first React controls for `SettingSync/*`:
  - sync enable
  - sync mode
  - server port
  - client host
  - max server snapshot count
- Preserved the legacy behavior that sync mode/host/port/snapshot controls are disabled while sync is enabled.
- Left sync auth code refresh and server device modal for dedicated service/UI batches.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Map sync device actions and server device modal to React services.
- Map theme and user API modal service boundaries.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
