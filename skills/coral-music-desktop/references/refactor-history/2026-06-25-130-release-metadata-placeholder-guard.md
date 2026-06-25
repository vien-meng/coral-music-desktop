# Step 130: Release Metadata Placeholder Guard

## Summary

- Reviewed publish/repository metadata after package identity and README validation were added.
- Kept package repository, bugs, and homepage fields empty until the real Coral Music repository target is known.
- Removed misleading upstream LX Music badges/releases from the README header and added a Coral-specific release status note.

## Changes

- Updated `README.md`:
  - removed upstream LX Music release/build badges from the Coral header,
  - added a clear note that official Coral repository, Issues, Releases, and publish channels are not configured yet,
  - clarified that upstream LX Music links are retained only as upstream references, compatibility docs, or acknowledgements,
  - clarified that upstream LX Music Releases are not Coral Music releases.
- Extended `build-config/smoke-package-audit.js`:
  - verifies package repository metadata is not pointing to upstream,
  - verifies README release status is Coral-specific,
  - keeps upstream links out of migrated UI components while allowing centralized upstream references.

## Verification

- `npm run smoke:package` passed.
- `npm run smoke:release` passed.
- `npm run lint` passed.

## Next Plan

1. Step 131: revisit UI/Electron click-through smoke once runtime startup is reliable.
2. Step 132: rerun `smoke:full` after any release metadata or runtime startup changes.
3. Step 133: when the real Coral Music repository is known, set `repository.url`, `bugs.url`, `homepage`, README badges, and `CORAL_PUBLISH_OWNER/CORAL_PUBLISH_REPO` workflow docs together.
