# Step 139: User API Playback Validation

Date: 2026-06-26

## Summary

- Added a shared React-side validation rule for playable User API sources.
- Prevented non-playable User API scripts from being selected as the current playback source.
- Made the installed API list show playable vs non-playable status.

## Changes

- Added `getPlayableUserApiSources`, `getPlayableUserApiSourceNames`, and `canPlayWithUserApi` helpers to `UserApiStore`.
- Added `playableUserApis`, `getPlayableSourceNames`, and `canPlay` store methods for UI reuse.
- Settings now warns when an imported User API does not declare any music `musicUrl` platform and leaves it installed but not current.
- The `设为当前` action is disabled for non-playable User APIs.
- The installed API list now shows `可播放` / `不可播放` tags and lists supported playback platforms.
- Removing the current source now falls back only to another playable User API.

## Verification

- `git diff --check`
- `npm run typecheck:react`

## Next Plan

1. Step 140: implement the external decoder runtime/transcode adapter.
2. Step 141: add focused playback capability smoke once the local file and User API flows are usable enough to guard.
