# Step 119: Release Readiness Audit

## Summary

- Hardened the release-readiness checks after Step 118 package identity cleanup.
- Centralized user-facing upstream links in `src/shared/brand.ts` so migrated React components no longer inline LX Music repository or documentation URLs.
- Added a release smoke command that composes the migration smoke, package audit, and React typecheck.

## Changes

- Added `coralProjectLinks` to `src/shared/brand.ts`.
- Updated Settings and SongList import flows to read upstream documentation links from `coralProjectLinks`.
- Reworded Settings About labels to make retained upstream links explicit.
- Changed package author metadata to `Coral Music Team`.
- Added `npm run smoke:release`.
- Extended `npm run smoke:package` to verify:
  - user-facing upstream links are centralized,
  - runtime title/tray fallback labels use `coralBrand.englishName`,
  - release smoke command exists.
- Replaced remaining runtime fallback labels from `LX Music` to the Coral brand in:
  - `src/renderer-react/services/musicSdk/index.ts`
  - `src/common/utils/renderer.ts`
  - `src/main/modules/tray.ts`

## Verification

- `npm run smoke:release` passed.
- `npm run lint` passed.
- `npm run build` passed.

## Packaging Dry Run

- `npm run pack:dir` passed the Vite build and native dependency rebuild stages.
- The first sandboxed run failed because Electron Builder could not resolve `github.com`.
- The escalated run reached Electron runtime download, but the downloaded zip was incomplete after several minutes and was interrupted to avoid blocking the migration loop.
- No source/build configuration error was found before the network download boundary.

## Next Plan

1. Step 120: add optional UI/Electron click-through smoke coverage if browser/Electron automation is practical in this environment.
2. Step 121: replace deprecated Ant Design `List` usages in migrated React panels, then rerun release smoke, lint, and build.
3. Step 122: resolve the known music SDK static/dynamic import warning by moving heavyweight online SDK entry usage behind lazy service boundaries.
