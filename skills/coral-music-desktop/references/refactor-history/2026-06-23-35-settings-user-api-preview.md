# 2026-06-23 Step 35 - Settings User API Preview

## Scope

- Continued the React migration for the Settings route.
- Added the first React User API metadata surface without migrating import/remove modal actions yet.

## Completed

- Extended `UserApiStore` with `refreshUserApis()`.
- Added a Settings route User API section that:
  - refreshes installed API metadata,
  - lists API name/version/author/source count,
  - marks the current `common.apiSource` entry.
- Kept import, online import, remove, and update-alert toggles on the legacy Vue side for a dedicated IPC/service batch.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Map User API import/remove/update-alert IPC contracts.
- Map theme selector/editor service boundaries.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
