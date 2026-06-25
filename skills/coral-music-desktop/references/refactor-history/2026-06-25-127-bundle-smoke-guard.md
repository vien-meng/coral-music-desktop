# Step 127: Bundle Smoke Guard

## Summary

- Added a non-network release guard after `pack:dir` was blocked by the environment usage limit.
- The new smoke verifies that route/code-splitting work remains explicit and does not hide bundle warnings by raising thresholds.

## Changes

- Added `build-config/smoke-bundle-config.js`.
- Added `npm run smoke:bundle`.
- Updated `npm run smoke:release` to run:
  - `smoke:migration`,
  - `smoke:package`,
  - `smoke:bundle`,
  - `typecheck:react`.
- Extended package audit to ensure `smoke:bundle` is registered.

## Bundle Smoke Coverage

- Renderer config has explicit manual chunks for React, icons, Ant Design runtime/core/components, MobX, and vendor.
- Lyric config has explicit manual chunks for React, icons, Ant Design runtime/core/components, MobX, vendor, and lyric font player.
- Renderer and lyric configs do not use `chunkSizeWarningLimit`.
- Main route panels are still loaded via `React.lazy` dynamic imports.

## Verification

- `npm run smoke:bundle` passed.
- `npm run lint` passed.
- `npm run smoke:release` passed.

## Next Plan

1. Step 128: retry `pack:dir` only when Electron runtime download is available.
2. Step 129: add UI/Electron click-through smoke when runtime startup is reliable.
3. Step 130: review publish metadata once the real Coral Music repository target is known.
