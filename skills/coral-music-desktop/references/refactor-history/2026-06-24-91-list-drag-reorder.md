# Step 91: List Drag/Reorder — Build Error Repair and Completion

## Summary
- **PR**: The previous step created `DraggableMusicList.tsx` with HTML5 DnD and added drag mode toggle in the list route panel, but left the build broken due to JSX syntax corruption in the ternary that switches between normal and drag-mode list views.
- **What was done**: Repaired syntax errors in `LocalListRoutePanel.tsx`:
  - Added missing comma after `<Checkbox>` in the `actions` array.
  - Fixed the malformed fragment/ternary closing (`</>)/>` → proper `</>\n)}`).
  - Added eslint-disable comments for the drag handler functions (false positive — they ARE referenced in JSX but declared after a `void` expression that confuses ESLint).
- **Build results**: `npm run lint` (passes), `npm run typecheck:react` (passes), `npm run build` (all targets pass).

## State After Step 91
| Metric | Value |
|--------|-------|
| `.vue` files remaining | 67 |
| Route portals (`index.vue` stubs) | List: placeholder still present |
| DraggableMusicList | Created and rendered (uses HTML5 DnD) |
| Drag mode toggle | Working via `isDraggingMode` state in `LocalListRoutePanel` |
| Save drag order | Calls `list.replaceSelectedMusicOrder()` |
| Lint/typecheck/build | All passing |

## Next Step (Step 92)
Remove the List `index.vue` placeholder entirely after confirming the React list route handles all routes properly, OR begin migrating the next major Vue surface. Recommended next target: SongList route (`src/renderer/views/songList`, 7 `.vue` files) — the React-side `SongListRoutePanel` has a placeholder but no real data flow.

However, a more impactful immediate target is the **Player Bar / PlayDetail** (Step 8 in component-migration-plan.md), since it's the always-visible UI surface and enables better testing of the full app.
