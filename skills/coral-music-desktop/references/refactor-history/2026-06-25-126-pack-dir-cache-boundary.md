# Step 126: Pack Dir Cache Boundary

## Summary

- Attempted to continue packaged-app readiness after renderer and lyric chunk warnings were removed.
- Planned a clean-cache `pack:dir` run with `ELECTRON_CACHE=/private/tmp/coral-electron-cache` to avoid the previously incomplete Electron zip in the default cache.
- The required escalated/network run was rejected by the environment usage limit before execution.

## Result

- No source files or build outputs were changed by the failed `pack:dir` attempt.
- The latest verified local gates remain:
  - `npm run build` passed,
  - `npm run lint` passed,
  - `npm run smoke:release` passed.
- Packaged `dir` verification remains pending because Electron Builder needs to download the Electron runtime zip.

## Recommended Retry

Run this when network/escalation quota is available:

```sh
ELECTRON_CACHE=/private/tmp/coral-electron-cache npm run pack:dir
```

Expected success criteria:

- Vite renderer/lyric/preload/main builds pass.
- Native dependency rebuild passes.
- Electron runtime downloads into the clean cache.
- Electron Builder creates `build/mac-arm64`.

## Next Plan

1. Step 127: keep working on non-network release cleanup and static guards.
2. Step 128: retry `pack:dir` once the environment can download Electron runtime artifacts.
3. Step 129: add UI/Electron click-through smoke after packaged/runtime startup is reliable.
