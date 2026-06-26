---
name: coral-music-desktop
description: Project-specific architecture, module map, and refactor guidance for 珊瑚音乐/coral-music-desktop. Use when working in this repository, analyzing modules, touching Electron main process, legacy Vue renderer, React renderer, desktop lyric renderer, workers, IPC, stores, player logic, sync, userApi, packaging, Ant Design UI, or planning/implementing the migration to Electron + React + MobX + Vite + TypeScript.
---

# 珊瑚音乐 / Coral Music Desktop

Use this skill as the project onboarding and refactor guide for `coral-music-desktop`, the 珊瑚音乐 / Coral Music Desktop codebase.
Start with the smallest reference that matches the task, then inspect the current source before editing because this project has many runtime-coupled modules.

## Workflow

1. Read `references/architecture-map.md` when you need the current runtime topology, boot flow, build flow, or high-level migration boundaries.
2. Read `references/module-inventory.md` when you need responsibility boundaries for `src/main`, legacy `src/renderer`, new `src/renderer-react`, `src/renderer-lyric`, new `src/lyric-react`, `src/common`, workers, views, stores, or packaging.
3. Read `references/refactor-plan.md` when planning or implementing the Electron + React + MobX + Vite + TypeScript + Ant Design migration.
4. Read `references/component-migration-plan.md` before converting Vue components from `src/renderer` or `src/renderer-lyric` to React.
5. Before edits, re-check the exact files involved with `rg`/`sed`; the references are a map, not a substitute for source.
6. After edits, validate the closest behavior surface first: IPC contract, worker bundling, DB persistence, player state, renderer route, or Ant Design UI integration, depending on what changed.

## Project Guardrails

- Keep `main`, legacy `renderer`, new `renderer-react`, legacy `renderer-lyric`, new `lyric-react`, renderer workers, main DB worker, and `user-api-preload` as separate build/runtime surfaces during migration.
- Preserve existing IPC channel names and DB schema during the first migration stages; wrap them with typed adapters before changing behavior.
- Treat `global.lx`, `window.lx`, `window.lxData`, and `window.app_event` as compatibility surfaces. Replace them gradually with typed services and MobX stores.
- Prefer Ant Design for common React UI controls and settings/forms; keep custom rendering for music rows, virtualized music lists, player controls, lyric rendering, audio visualization, and Electron window chrome.
- Do not collapse the desktop lyric window into the main renderer; it is an independent Electron window with a direct `MessageChannelMain` link to the main window.
- Keep native packaging details visible: `better-sqlite3`, `qrc_decode.node`, tray/taskbar assets, license files, and `electron-builder` hooks all affect distributable builds.
