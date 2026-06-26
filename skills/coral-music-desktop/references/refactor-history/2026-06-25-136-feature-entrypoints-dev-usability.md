# Step 136: Feature Entry Points And Dev Usability

Date: 2026-06-25

## Summary

- Prioritized usable feature entry points over continuing the decoder runtime work.
- Fixed a React white-screen crash in the local list route.
- Added top-level access for opening local audio files and adding User API source plugins.

## Changes

- Moved `handleDragReorder`, `handleSaveDragOrder`, and `toggleDragMode` back to `LocalListRoutePanel` component scope. They had been nested inside `handleShuffleSelectedList`, leaving the drag-mode button with an undefined handler and crashing React.
- Changed main-window `min`, `max`, and `close` IPC registrations to `mainHandle` so they match the React service's `ipcRenderer.invoke` calls.
- Added `UiStore` quick actions for one-shot cross-route commands.
- Added header actions:
  - `打开本地文件` routes to the local list and opens the local audio picker.
  - `添加音源` exposes file import and online URL import for User API sources.
- Updated local audio import so it creates or selects a target list before opening the picker, instead of silently doing nothing when no list is selected.

## Verification

- `git diff --check`
- Static reference check for the new quick actions and restored drag handler.
- Did not keep looping on `npm run dev`; the previous dev run had already identified the white-screen stack at `LocalListRoutePanel.tsx`.

## Next Plan

1. Step 137: implement the external decoder runtime/transcode adapter.
2. Step 138: polish User API source-plugin status and validation.
3. Step 139: add focused playback capability smoke only after the local/import/source flows are functionally usable.
