# Step 123: Route-Level Code Splitting

## Summary

- Continued bundle-size cleanup after Step 122 moved the music SDK behind lazy service boundaries.
- Converted the six main React route panels from static imports to `React.lazy` dynamic imports.
- Added a Suspense fallback for route transitions and updated migration smoke expectations to require lazy route imports.

## Changes

- Updated `src/renderer-react/app/routeConfig.tsx`:
  - replaced static route panel imports with `lazy(async() => import(...))`,
  - kept route keys, labels, icons, and element contract unchanged.
- Updated `src/renderer-react/app/router.tsx`:
  - wraps the active route element in `Suspense`,
  - renders a small centered Ant Design `Spin` fallback while route chunks load.
- Added `.coral-route-loading` styles.
- Updated `build-config/smoke-migration.js` so route wiring checks expect dynamic route imports.

## Verification

- `npm run typecheck:react` passed.
- `npm run smoke:migration` passed.
- `npm run build:renderer` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:release` passed.

## Build Result

- Renderer build now emits route chunks:
  - `SearchRoutePanel-*.js`
  - `SongListRoutePanel-*.js`
  - `LeaderboardRoutePanel-*.js`
  - `LocalListRoutePanel-*.js`
  - `DownloadRoutePanel-*.js`
  - `SettingsRoutePanel-*.js`
- Main renderer entry dropped from about 1.305 MB after Step 122 to about 316 KB.
- Shared `base-*.js` is now the largest renderer chunk at about 718 KB.
- Remaining warnings are chunk-size warnings for renderer shared base and lyric renderer.

## Next Plan

1. Step 124: continue bundle review by splitting vendor/shared base chunks if it can be done without hurting route caching.
2. Step 125: retry packaged `pack:dir` after Electron runtime cache/download is stable.
3. Step 126: revisit UI/Electron click-through automation once the runtime environment is predictable.
