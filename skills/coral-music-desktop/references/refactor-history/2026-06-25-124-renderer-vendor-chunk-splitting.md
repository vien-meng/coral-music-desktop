# Step 124: Renderer Vendor Chunk Splitting

## Summary

- Continued bundle-size cleanup after route-level code splitting.
- Added renderer-only manual chunk rules to split React, MobX, SDK, generic vendor, icons, rc/Ant Design internals, and Ant Design component modules.
- Removed the renderer chunk-size warning; the remaining chunk warning is now only in the lyric renderer.

## Changes

- Updated `build-config/vite/renderer.config.ts`:
  - added `getManualChunk()`,
  - split React into `vendor-react`,
  - split MobX into `vendor-state`,
  - split Ant Design icons into `vendor-icons`,
  - split Ant Design runtime helpers,
  - split Ant Design components by `antd/es/<component>`,
  - kept other dependencies in `vendor`.

## Verification

- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run smoke:release` passed.
- `npm run lint` passed.

## Build Result

- Renderer entry is about 118 KB.
- The largest renderer chunk is now `vendor-antd-_util-*.js` at about 377 KB.
- `sdk-*.js` is about 153 KB.
- The renderer build no longer emits a chunk-size warning.
- Full build still emits the known lyric renderer warning: `lyric-*.js` is about 603 KB.

## Next Plan

1. Step 125: reduce lyric renderer chunk pressure with a focused lyric/Vendor split if it is safe.
2. Step 126: retry packaged `pack:dir` after Electron runtime download/cache is stable.
3. Step 127: revisit UI click-through automation after package/runtime environment noise is lower.
