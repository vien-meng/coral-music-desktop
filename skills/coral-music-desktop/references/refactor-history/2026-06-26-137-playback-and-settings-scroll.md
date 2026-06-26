# Step 137: Playback Source Proxy And Settings Scroll

Date: 2026-06-26

## Summary

- Restored the React playback path for User API-backed online music URLs.
- Fixed the shell layout so Settings can scroll to all lower sections.
- Tightened the header actions after adding local-file and source-management entry points.

## Changes

- Added typed `requestUserApi` IPC to the React client contract and service layer.
- Added `src/renderer-react/services/musicSdkRuntime.ts` to initialize the legacy SDK runtime from `common.apiSource` and expose User API `musicUrl` proxy functions.
- Updated `musicUrlResolver` so playback syncs the SDK runtime before fetching URLs and shows an actionable missing-source error instead of raw `Api is not found`.
- Imported User API scripts are now set as the current source immediately after import.
- Updated shell CSS with fixed header/footer flex sizing, `min-height: 0` layout constraints, and scrollable content behavior so Settings no longer traps lower content offscreen.
- Made header actions more compact by removing debug tags and shortening the local-file action label.

## Verification

- `git diff --check`
- `npm run typecheck:react`

## Next Plan

1. Step 138: implement external decoder runtime/transcode support for unsupported local formats.
2. Step 139: polish visible source-plugin status and missing-source guidance across player/search/list surfaces.
