# Step 125: Lyric Vendor Chunk Splitting

## Summary

- Continued bundle-size cleanup after renderer chunk warnings were removed in Step 124.
- Added lyric-renderer-only manual chunk rules for React, MobX, Ant Design, icons, rc dependencies, generic vendor, and the shared lyric font player.
- Removed the remaining full-build chunk-size warning.

## Changes

- Updated `build-config/vite/lyric.config.ts`:
  - added `getManualChunk()`,
  - split React into `lyric-vendor-react`,
  - split MobX into `lyric-vendor-state`,
  - split Ant Design icons/runtime/components,
  - split common lyric font player into `lyric-font-player`,
  - kept other dependencies in `lyric-vendor`.

## Verification

- `npm run build:renderer-lyric` passed.
- `npm run build` passed.
- `npm run lint` passed.
- `npm run smoke:release` passed.

## Build Result

- Lyric main chunk dropped from about 603 KB to about 31 KB.
- The largest lyric chunk is now `lyric-vendor-antd-_util-*.js` at about 346 KB.
- Full `npm run build` no longer emits renderer or lyric chunk-size warnings.

## Next Plan

1. Step 126: retry packaged `pack:dir` once Electron runtime download/cache is stable, or document a deterministic cache setup path.
2. Step 127: add UI/Electron click-through smoke if the runtime environment is stable enough.
3. Step 128: review package publish scripts and repository metadata once the real Coral Music repository target is known.
