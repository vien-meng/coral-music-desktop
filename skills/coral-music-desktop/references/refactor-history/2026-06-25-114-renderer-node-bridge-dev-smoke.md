# Step 114: Renderer Node Bridge And Dev Smoke

## Summary

- Continued after Step 113 Vue compatibility and package cleanup.
- Re-ran `npm run dev` with local-port/Electron permissions available.
- The app reached Electron startup and DB initialization, but the renderer crashed on a browser-externalized Node builtin:
  - `Module "node:zlib" has been externalized for browser compatibility. Cannot access "node:zlib.gzip" in client code.`
- Fixed the startup blocker by removing React renderer static imports from `@common/utils/nodejs` and by moving renderer-needed file/zlib/path helpers behind a runtime Node bridge.

## Changes

- Added `src/renderer-react/services/nodeBridgeService.ts`.
  - Provides `joinPath`, `basename`, `checkPath`, `readFile`, `copyFile`, `moveFile`, `removeFile`, `saveStrToFile`, `saveLxConfigFile`, and `readLxConfigFile`.
  - Uses Electron renderer runtime `globalThis.require` so Vite does not emit browser-externalized imports for `node:fs`, `node:path`, or `node:zlib`.
- Updated React services and settings UI to use the new bridge instead of `@common/utils/nodejs`:
  - backup import/export,
  - list import/export,
  - theme background file management,
  - custom source file reading,
  - local-file playback path checks.
- Tightened the migrated music SDK boundary:
  - removed the `@common/utils/nodejs` re-export from `services/musicSdk/index.ts`,
  - re-exported only the SDK-needed `toMD5`,
  - changed SDK zlib/crypto/dns helpers from static Node imports to runtime `globalThis.require`.
- Updated `component-migration-plan.md` so the next batch starts with real download runtime smoke, then automated smoke coverage and remaining bundle-warning cleanup.

## Verification

- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
  - Build still reports non-blocking browser-externalized warnings from remaining Node-oriented request/logging dependencies, especially `needle`, `tunnel`, `electron-log`, and `src/common/utils/lyricUtils/kg.js`.
- `npm run dev`: passed startup smoke.
  - renderer dev server ready at `http://localhost:9080/`,
  - lyric dev server ready at `http://localhost:9081/`,
  - renderer-scripts and main builds ready,
  - Electron started and DB initialized,
  - no repeat of the earlier `node:zlib.gzip` renderer crash during the smoke window.
- `find src -name "*.vue"`: no output.
- Vue/Webpack source/config search: no active project hits.
- React/lyric legacy renderer bridge search:
  - `rg "@common/utils/nodejs|window\\.lx\\.worker|@renderer/|../../renderer|../../../renderer" src/renderer-react src/lyric-react`: no output.

## Remaining Risks

- This step verified startup, not a full interactive download smoke. Real file download behavior still needs a hands-on dev pass.
- Production build warnings show that Node-oriented dependencies can still enter the renderer chunk. They are not blocking the build now, but should be reduced before packaging confidence is considered high.

## Next Step

- Step 115: execute the real download runtime smoke pass in dev mode:
  - create single and batch download tasks,
  - start, pause, retry, and resume tasks,
  - verify URL refresh retry,
  - verify progress/status persistence,
  - verify sidecar lyric and embedded metadata output,
  - record any runtime gaps before adding automated smoke coverage in Step 116.
