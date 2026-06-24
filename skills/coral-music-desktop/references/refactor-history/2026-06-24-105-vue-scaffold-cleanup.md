# Step 105: Vue Scaffold Cleanup

## Summary
- Removed remaining Vue-specific boot/scaffold files:
  - `src/renderer/main.ts`
  - `src/renderer/index.html`
  - `src/renderer/router.ts`
  - `src/renderer/components/`
  - `src/renderer/core/useApp/`
  - `src/renderer/plugins/index.ts`
  - `src/common/types/shims_vue.d.ts`
  - `src/common/utils/vueRouter.ts`
  - `src/common/utils/vueTools.ts`
- Removed old Vue-state modules no longer used by React or musicSdk:
  - `src/renderer/core/`
  - `src/renderer/event/`
  - `src/renderer/plugins/`
  - `src/renderer/store/`
  - `src/renderer/types/`
  - dead renderer utility composition/data/ipc/keyBind/message/pickr/update files
- Kept the React-compatible legacy music SDK chain:
  - `src/renderer/utils/musicSdk`
  - `src/renderer/utils/request.ts`
  - `src/renderer/utils/env.js`
  - `src/renderer/utils/index.ts`
  - `src/renderer/utils/music.ts`
- Restored a minimal `src/renderer/utils/message.ts` because `request.ts` still uses `requestMsg` for musicSdk error normalization.
- Refactored `src/lang/i18n.ts` to remove its Vue import.

## Verification
- `find src -name "*.vue"` returns no files.
- `rg '\\.vue|vueRouter|vueTools|shims_vue|createApp\\(|from '\\''vue'\\''' src package.json build-config vite.config.ts` returns no project Vue hits.
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.

## Current State
- Vue SFC count: **0**
- React main renderer: `src/renderer-react`
- React lyric renderer: `src/lyric-react`
- Legacy code retained only where React still depends on it:
  - music SDK compatibility under `src/renderer/utils/musicSdk`
  - renderer request compatibility helpers
  - worker directory retained for future download-worker migration reference

## Next Step
- Step 106: migrate the remaining legacy musicSdk path out of `src/renderer` into `src/shared` or `src/renderer-react/services`, then remove the last `src/renderer` compatibility island.
