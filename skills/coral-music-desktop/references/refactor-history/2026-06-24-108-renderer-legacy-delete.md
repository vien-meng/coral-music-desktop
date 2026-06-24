# Step 108: Renderer Legacy Delete

## Summary
- Deleted the remaining `src/renderer` directory after React and lyric sources no longer referenced it.
- Updated `component-migration-plan.md` inventory:
  - Vue SFC count is now 0.
  - `src/renderer` is removed.
  - `src/renderer-lyric` remains removed.
- Marked Step 15 cleanup tasks complete for Vue scaffold, Vue types, Vue router tools, and legacy renderer directory removal.

## Verification
- `npm run build:renderer` passed before deleting the old renderer directory.
- `find src -name "*.vue"` returns no files.
- `rg '\\.vue|from '\\''vue'\\''|from "vue"|vueRouter|vueTools|shims_vue|createApp\\(' src package.json build-config vite.config.ts` returns no project hits.
- `rg '../../renderer|../../../renderer|@renderer/|window\\.lx\\.worker' src/renderer-react src/lyric-react` returns no hits.
- `test ! -d src/renderer` passed.
- `npm run lint` passed.
- `npm run typecheck:react` passed with Step 106-107 service files included.
- `npm run build` passed.

## Next Step
- Step 109: migrate the full download runtime bridge for start/pause/retry/progress and filesystem-side effects behind typed IPC or an Electron worker surface.
