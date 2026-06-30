# Step 106: Music SDK React Home

## Summary
- Moved the remaining React-used music SDK chain out of the legacy renderer tree.
- New React-owned location:
  - `src/renderer-react/services/musicSdk/sdk`
  - `src/renderer-react/services/musicSdk/request.ts`
  - `src/renderer-react/services/musicSdk/env.js`
  - `src/renderer-react/services/musicSdk/message.ts`
  - `src/renderer-react/services/musicSdk/index.ts`
  - `src/renderer-react/services/musicSdk/types`
  - `src/renderer-react/services/musicSdk/simplify-chinese-main`
- Updated React services to import the SDK from the new React service boundary:
  - `onlineMusicService.ts`
  - `musicDetailService.ts`
  - `musicCommentService.ts`
  - `playerRuntime/musicUrlResolver.ts`

## Verification
- `rg '../../renderer|../../../renderer|@renderer/|window\\.lx\\.worker|worker\\.download' src/renderer-react src/lyric-react` returns no hits after this step.
- `npm run build:renderer` passed.

## Next Step
- Step 107: remove React download task creation dependency on the old `window.coral.worker.download` global.
