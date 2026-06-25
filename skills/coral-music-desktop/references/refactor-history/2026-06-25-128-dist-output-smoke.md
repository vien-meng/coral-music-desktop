# Step 128: Dist Output Smoke

## Summary

- Added a non-network build artifact smoke after packaged `pack:dir` remained blocked by Electron runtime download requirements.
- The new smoke validates generated `dist` contents after `npm run build`, including required Electron entry files, route chunks, vendor chunks, and browser chunk size ceilings.
- Added `smoke:full` as the strongest no-network validation command.

## Changes

- Added `build-config/smoke-dist-output.js`.
- Added package scripts:
  - `smoke:dist`
  - `smoke:full`
- Extended package audit so `smoke:dist` and `smoke:full` stay registered.

## Dist Smoke Coverage

- Required files:
  - `dist/index.html`
  - `dist/lyric.html`
  - `dist/main.js`
  - `dist/user-api-preload.js`
  - `dist/dbService.worker.js`
- Renderer route chunks:
  - search
  - song-list
  - leaderboard
  - local list
  - download
  - settings
- Renderer and lyric vendor chunks:
  - SDK
  - Ant Design utility chunks
  - MobX/state chunks
  - lyric font player chunk
- Browser asset chunks must stay under 500 KiB.
- Preload and DB worker outputs have bounded size checks.

## Verification

- `npm run smoke:dist` passed.
- `npm run smoke:package` passed.
- `npm run lint` passed.
- `npm run smoke:full` passed.

## Current Strongest No-Network Gate

```sh
npm run smoke:full
```

This runs:

1. `npm run build`
2. `npm run lint`
3. `npm run smoke:release`
4. `npm run smoke:dist`

## Next Plan

1. Step 129: prepare an Electron runtime cache/retry note for packaged `pack:dir` and keep it out of automated no-network smoke.
2. Step 130: add UI/Electron click-through smoke once runtime startup is reliable.
3. Step 131: review publish metadata once the real Coral Music repository URL is known.
