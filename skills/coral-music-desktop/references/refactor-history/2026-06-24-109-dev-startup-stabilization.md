# Step 109: Dev Startup Stabilization

## Summary
- Fixed `npm run dev` startup priority before continuing the download runtime migration.
- The original sandbox failure was `listen EPERM` on the renderer dev ports.
- After enabling elevated startup verification, additional dev-only runtime issues were found and fixed:
  - main dev bundle called a missing `init_common$1()`.
  - renderer dev ESM import expected default export from the UMD `infSign.min.js`.
  - renderer dev ESM import expected named export from CommonJS `src/common/theme/utils.js`.
  - renderer imported `@common/utils`, which pulled `electron-log/node` into the browser dev bundle.
  - React DevTools extension install produced a non-fatal cached CRX header error on every startup.

## Changes
- `build-config/runner-dev.js`
  - Reads actual Vite `server.resolvedUrls.local[0]`.
  - Sets `CORAL_RENDERER_DEV_URL` and `CORAL_LYRIC_DEV_URL` before spawning Electron.
  - Passes the env explicitly to the Electron child process.
  - Prints targeted `EPERM` / `EADDRINUSE` port guidance.
- `build-config/vite/renderer.config.ts` and `lyric.config.ts`
  - Support `CORAL_DEV_HOST`, `CORAL_RENDERER_DEV_PORT`, and `CORAL_LYRIC_DEV_PORT`.
- Main window and lyric window dev loading now prefer the injected env URLs.
- Removed `export * from './common'` from `src/common/utils/index.ts`; modules that need common helpers import `@common/utils/common` directly.
- Added React-side ESM wrappers/utilities:
  - `src/renderer-react/services/musicSdk/sdk/kg/infSign.ts`
  - `src/renderer-react/services/themeColorUtils.ts`
- `src/main/index-dev.ts`
  - Keeps opening DevTools.
  - Makes React DevTools extension installation opt-in with `CORAL_INSTALL_REACT_DEVTOOLS=true`.

## Verification
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.
- Sandboxed `npm run dev` still reports `EPERM`, but now prints actionable host/port guidance.
- Elevated `npm run dev` starts:
  - renderer dev server on `http://localhost:9080/`
  - renderer-lyric dev server on `http://localhost:9081/`
  - renderer-scripts watch build
  - main watch build
  - Electron main process
- Elevated `CORAL_RENDERER_DEV_PORT=9180 CORAL_LYRIC_DEV_PORT=9181 npm run dev` starts the dev servers on the configured ports.

## Next Step
- Step 110: resume the download runtime bridge migration for start/pause/retry/progress, URL refresh, filesystem path checks, lyrics, and metadata side effects.
