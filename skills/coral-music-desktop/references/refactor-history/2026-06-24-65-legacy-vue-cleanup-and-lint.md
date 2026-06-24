# Step 65: Legacy Vue Cleanup And Lint Baseline

## Context

After the player queue-skip batch, the project still carried completed Vue component modules from earlier React migrations and a large React/Vite lint baseline. The user asked to continue the follow-up plan and clean already-refactored Vue module code.

## Changes

- Removed completed legacy Vue base component module:
  - `src/renderer/components/base`
- Removed completed legacy Vue plugin modules:
  - `src/renderer/plugins/Dialog/Dialog.vue`
  - `src/renderer/plugins/SvgIcon`
  - `src/renderer/plugins/Tips`
- Removed React-replaced app-shell Vue modules:
  - `src/renderer/components/layout/Aside`
  - `src/renderer/components/layout/Toolbar`
  - `src/renderer/components/layout/View.vue`
- Added a minimal non-Vue `src/renderer/plugins/Dialog/index.js` compatibility stub because several legacy, not-yet-migrated Vue modules still import `@renderer/plugins/Dialog`.
- Ran ESLint auto-fix across the active React/Vite lint scope and manually removed the final unused import in `dialogService.ts`.
- Current remaining Vue inventory is 102 `.vue` files, down from the original 122.

## Validation

- `npm run lint`
- `npm run typecheck:react`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- Settings Vue modules were not deleted because `component-migration-plan.md` still tracks Settings Route as in progress and the React settings surface should receive a focused smoke pass before removal.
- PlayBar/PlayDetail Vue modules were not deleted because Step 8 still has fullscreen event sync and full lyric scroll-sync parity pending.
- Common sound-effect and download modal Vue modules were not deleted; they do not yet have full React parity.
- Legacy utility and SDK files under `src/renderer/utils` remain because the React player and online services still use them through controlled dynamic-import boundaries.

## Next Plan

1. Smoke-test Settings Route, then remove `src/renderer/views/Setting` only after parity is confirmed.
2. Finish PlayDetail fullscreen event sync and lyric scroll-sync parity before deleting old PlayDetail Vue files.
3. Port common sound-effect/download modal surfaces before deleting their legacy Vue modules.
4. Continue reducing Vue inventory by module, not by blanket deletion.
