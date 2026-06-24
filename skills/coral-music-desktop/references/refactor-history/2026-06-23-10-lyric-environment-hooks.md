# 2026-06-23 Step 10 - Lyric Environment Hooks

## Scope

- Migrated the remaining useful `src/renderer-lyric/useApp/*` side effects into the React lyric renderer.
- Preserved legacy global page helpers used by the lyric window:
  - `window.setLang`
  - `window.setTheme`
  - `window.setLyricColor`
  - `window.os`

## Completed

- Added the old lyric-window HTML environment setup to `src/lyric-react/lyric.html`, including transparent background, OS class, theme query hydration, and CSS variable style tags.
- Added lyric-window global typings in `src/lyric-react/vite-env.d.ts`.
- Added `src/lyric-react/services/lyricEnvironment.ts` for language, theme, and lyric color side effects.
- Wired React config hydration/change handling to update document language and lyric color CSS variables.
- Wired theme IPC updates to call `window.setTheme()` while still updating Ant Design theme mode.
- Completed the `useLyric.ts` migration by refreshing playback status after playback-rate changes while playing.
- Updated the component migration plan to mark `useTheme.ts`, `useCommon.ts`, and `useLyric.ts` as migrated.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer-lyric`
- Passed: `npm run build`

## Next Plan

- Review whether the legacy `renderer-lyric` directory can now be excluded from active build/type surfaces without deleting it.
- Start the next main renderer component group once the lyric window migration has a clean checkpoint.
- Keep any future removal of Vue source gated behind an explicit compatibility check against Electron runtime behavior.
