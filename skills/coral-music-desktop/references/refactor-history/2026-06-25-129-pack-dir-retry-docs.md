# Step 129: Pack Dir Retry Docs

## Summary

- Documented the current no-network validation flow and packaged `pack:dir` retry path.
- Kept packaged directory verification out of automated smoke commands because Electron Builder must download Electron runtime artifacts.
- Added a deterministic clean-cache command for future local packaging retries.

## Changes

- Updated `README.md` with:
  - migration development verification commands,
  - `smoke:full` as the strongest no-network validation chain,
  - fine-grained smoke command list,
  - `smoke:download` runtime note,
  - clean-cache `pack:dir` retry command.

## Recommended Pack Dir Retry

```sh
ELECTRON_CACHE=/private/tmp/coral-electron-cache npm run pack:dir
```

Expected output on macOS arm64:

- Vite renderer/lyric/preload/main builds pass.
- Native dependency rebuild passes.
- Electron runtime downloads into the clean cache.
- Electron Builder creates `build/mac-arm64`.

## Verification

- `npm run smoke:package` passed.
- `npm run smoke:bundle` passed.
- `npm run smoke:dist` passed.
- `npm run lint` passed.

## Next Plan

1. Step 130: review publish/repository metadata and leave explicit placeholders until the real Coral Music repository URL is known.
2. Step 131: add UI/Electron click-through smoke after runtime startup and/or packaged dir verification is reliable.
3. Step 132: rerun `smoke:full` after any metadata changes.
