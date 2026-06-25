# Step 117: Renderer Node Warning Cleanup

## Summary

- Continued after Step 116 migration smoke coverage.
- Focused on the remaining renderer production build warnings from Node-only dependencies.
- Removed the Vite/Rolldown browser-externalized warnings for `needle`, `tunnel`, `zlib`, `electron`, and `electron-log/node`.

## Changes

- Updated `src/common/rendererIpc.ts`.
  - Replaced static `import { ipcRenderer } from 'electron'` with a cached runtime `globalThis.require('electron').ipcRenderer`.
- Updated `src/renderer-react/services/musicSdk/request.ts`.
  - Replaced static `needle` and `tunnel` imports with runtime `globalThis.require`.
  - Kept type-only imports for request shapes.
- Updated `src/common/utils/lyricUtils/kg.js`.
  - Replaced static `zlib` import with runtime Node require.
- Updated `src/common/utils/index.ts`.
  - Replaced static `electron-log/node` import with a lazy runtime logger wrapper.
  - Keeps main-process `log.info/warn/error/debug` call sites working while preventing the renderer bundle from pulling `electron-log` and its Node dependencies.

## Verification

- `npm run build:renderer`: passed.
  - Node builtin externalization warnings are gone.
  - Renderer main chunk dropped from roughly 1.88 MB before Step 114/117 cleanup to roughly 1.53 MB.
  - Remaining warnings:
    - `INEFFECTIVE_DYNAMIC_IMPORT` for the music SDK being both statically and dynamically imported,
    - chunk-size warning.
- `npm run smoke:migration`: passed.
- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run smoke:download`: passed.
  - Runtime notes: dev still prints expected Electron security warnings and an Ant Design `List` deprecation warning.

## Remaining Risks

- The music SDK still lands in the main renderer chunk because `onlineMusicService` and `musicDetailService` statically import it while download/comment/playback paths dynamically import it.
- Chunk size is still above the default Vite threshold.
- Ant Design `List` usage now logs a deprecation warning in dev and should be handled in a UI polish step.

## Next Step

- Step 118: final polish track:
  - package smoke,
  - app identity/resources audit,
  - chunk/code-splitting review,
  - dependency/license cleanup,
  - decide whether to split `musicSdk` route loading before release.
