# Step 120: UI Automation Scope

## Summary

- Evaluated the optional UI/Electron click-through smoke track after release smoke and build were green.
- Deferred a new click-through harness for now because the current environment already exposed a slow/flaky Electron runtime download boundary during `pack:dir`, while the existing dev/download smoke and static migration smoke cover the highest-risk migrated behavior.

## Current Automated Coverage

- `npm run smoke:migration`
  - verifies no Vue source files,
  - verifies active React route wiring,
  - verifies online route service/store wiring,
  - verifies download IPC/runtime/store wiring,
  - verifies no deleted renderer bridge references.
- `npm run smoke:download`
  - starts Electron dev mode,
  - verifies download start/progress/pause/retry/completion,
  - verifies failed URL handling,
  - verifies sidecar lyric output.
- `npm run smoke:package`
  - verifies Coral package identity,
  - verifies publish guardrails,
  - verifies package resources,
  - verifies centralized upstream links and Coral fallback labels.
- `npm run smoke:release`
  - composes migration smoke, package audit, and React typecheck.

## Decision

- Keep UI click-through automation as a follow-up once local Electron runtime downloads/cache are stable.
- Continue with Step 121 because the Ant Design `List` deprecation is a known dev warning and can be removed without new dependencies.

## Next Plan

1. Step 121: replace deprecated Ant Design `List` usage with a small React `PlainList` base component.
2. Step 122: reduce the known music SDK static/dynamic import warning and continue bundle-size cleanup.
