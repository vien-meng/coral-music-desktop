# 2026-07-22 Step 143 - Settings Runtime And LX Sync

## Scope

- Repair React settings that previously only wrote configuration without changing the running app.
- Restore LX Music v4 sync wire compatibility and expose the existing sync client in the active React settings page.

## Findings

- The sync IPC implementation and client/server modules already existed, but the sync module was not registered during main-process startup and the settings toggle only persisted `sync.enable`.
- The supplied service answered the LX v4 public handshake endpoints (`/hello` and `/id`), while the Coral rename had changed the authentication and socket marker strings away from LX-compatible values.
- The React settings surface also persisted several values whose natural React runtime consumers were missing, notably UI presentation, search/ODC, list display, download policy, playback policy, and OpenAPI lifecycle.

## Implementation Decisions

- Keep the existing IPC channels, persisted keys, negotiated-device-key storage, list/dislike sync transport, and no new dependencies.
- Treat the pairing code as an ephemeral form field: send it only to the existing connect IPC action, never persist or log it.
- Use a single settings runtime bridge for lifecycle services (sync/OpenAPI) so startup, live setting changes, and shutdown use the same path.
- Implement settings only where the active React product has a clear behavior. Do not create legacy-only UI merely to retain a stored key.

## Validation

- Add a focused smoke check covering LX protocol markers, sync registration, lifecycle hooks, and the active settings consumers.
- Run the React typecheck, relevant smoke check, lint, and renderer build.
- Pair against the supplied service manually after the application build; do not include the link code in source, fixtures, logs, or this record.

## Completed

- Registered sync and OpenAPI runtime modules at application startup; both now apply persisted enable/configuration values and stop cleanly with the main window.
- Restored the LX v4 wire markers, added client/server status surfaces, an ephemeral pairing-code input, server-only device controls, and the required first-sync conflict-choice modal.
- Connected OpenAPI controls to the real server lifecycle with port validation and restart-on-reconfigure behavior.
- Added active React consumers for global font/motion and play-bar style, lyric translation/romanization/scroll/zoom, download enable, source visibility, and persisted search history/ODC cleanup.
- Added `smoke:settings-sync`; `npm run check-type`, the new smoke check, `npm run build:renderer`, and `npm run build` pass.

## Known Baseline

- Repository-wide `npm run lint:es` still reports pre-existing errors in unrelated audio-output, library, worker, SDK, and formatting files. None are in this change set.

## Follow-up: Syncable Online Favorites

- Online songlist favorites now create a source-tagged local mirror list containing every loaded remote page. The existing standard list-sync transport carries that list and its songs to other clients without requiring a public LX server change.
- The mirror is named `收藏：<歌单名>` and appears in “我的列表” on the receiving client. Removing the online favorite removes the mirror as well.
