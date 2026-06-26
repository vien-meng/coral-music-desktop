# Step 118: Package Polish And Identity Audit

## Summary

- Continued the final polish track after the download runtime smoke, migration smoke, and renderer Node warning cleanup were green.
- Focused this batch on packaged app identity and repeatable release-adjacent checks.
- Added a package audit command so stale upstream package names, installer names, desktop entry names, and publish targets are caught before packaging.

## Changes

- Updated `build-config/build-pack.js`:
  - `appId` is now `cn.coral.music.desktop`.
  - `productName` is now `Coral Music`.
  - protocol display name is now `coral-music-protocol`.
  - Windows legal trademark and shortcut name are now `Coral Music`.
  - Linux desktop names are now `Coral Music`, `珊瑚音乐`, and `珊瑚音樂`.
  - DMG title is now `Coral Music v${version}`.
  - GitHub publish configuration no longer points to the old source project; publish builds now require explicit `CORAL_PUBLISH_OWNER` and `CORAL_PUBLISH_REPO`.
- Added `build-config/smoke-package-audit.js`.
- Added `npm run smoke:package`.

## Verification

- `npm run smoke:package` passed.
- `npm run smoke:migration` passed.
- `npm run typecheck:react` passed.
- `npm run lint` passed.
- `npm run build` passed.

## Notes

- The deep-link URL scheme and Linux MIME entry now use the Coral identity.
- `npm run build` still reports only the known music SDK static/dynamic import warning and chunk-size warnings.

## Next Plan

1. Step 119: run a release-readiness pass over package scripts, lockfile dependency categories, known upstream links, and packaging dry-run behavior.
2. Step 120: add optional UI/Electron click-through smoke coverage for migrated routes and download controls.
3. Step 121: replace deprecated Ant Design `List` usages or document a focused UI upgrade boundary if it becomes a larger pass.
