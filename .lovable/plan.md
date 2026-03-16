
## Analysis: Can we switch to `drive.file` scope?

### What `drive.file` scope means
The `https://www.googleapis.com/auth/drive.file` scope only allows the app to see, edit, create, and delete **files that the app itself creates or the user explicitly opens via the Google Picker**. It cannot list or search arbitrary folders/files in Drive.

### Current usage that DEPENDS on broad `drive` scope

Looking at `googleDriveService.ts`, the app currently uses these Drive API patterns that **break** under `drive.file`:

1. **`listBizSuiteAccounts()`** — Does a search query: `name contains 'BizSuite Backups'`. Under `drive.file`, this search returns empty results because it can't list folders it didn't create *in this session*.
2. **`findLegacyFolders()`** — Same search query, same problem.
3. **`listBackups()`** — Lists files within a folder using `'folderId' in parents`. This works IF the folder was created by the app, but only if that folder's ID is already known.
4. **`getOrCreateFolder()`** — Falls back to searching by name, which fails under `drive.file`.
5. **`getOrCreateSheetsFolder()`** — Same search-by-name fallback, fails.
6. **`listSpreadsheets()`** — Lists spreadsheets in the sheets folder.

### Key insight about `drive.file`
Under `drive.file`, the app CAN:
- Create new folders/files (they become visible to the app)
- Read/write files the app created
- Read/write files opened via Google Picker

The app CANNOT:
- Search for existing folders by name query
- Discover previously created folders in a new session (the folder was created before and the token expired)

### The core problem: Folder discovery
The entire workspace/account system relies on **searching by folder name** to re-discover workspaces across sessions and after token refresh. Under `drive.file`, once the token expires and the user reconnects, the app can no longer find its own previously created folders (they weren't "opened" in the new session).

### What needs to change for `drive.file` to work

**Strategy: Store folder IDs in localStorage, use them directly instead of searching**

1. **`GoogleDriveContext.tsx`** — Change the scope from `drive` to `drive.file` + keep `userinfo.email` + `spreadsheets`
2. **`googleDriveService.ts`** — Rewrite folder discovery methods to:
   - Instead of searching by name, accept known folder IDs passed in directly
   - `listBizSuiteAccounts()` → Can't search; instead, rely on locally stored account data (IDs already saved in `GoogleDriveSettings.backupFolderId` and `currentAccountId`)
   - `getOrCreateFolder()` → Use the stored `currentAccountFolderId` (already set via `setCurrentAccountFolder`) rather than falling back to search
   - `findLegacyFolders()` → Remove or make it a no-op (legacy migration can't work without broad search)
3. **`GoogleDriveContext.tsx`** — On first connect (no stored folder ID), create a new workspace folder immediately and store its ID. On reconnect, use the stored folder ID directly — no search needed.
4. **`AccountSelectionModal.tsx`** — The "discover existing workspaces" flow currently relies on `listBizSuiteAccounts()` which searches Drive. This needs to be adapted: if no stored accounts exist, offer to create a new one only.

### Spreadsheets scope
`https://www.googleapis.com/auth/spreadsheets` is unchanged — this is already restricted to spreadsheets only.

### Plan summary

**Files to change:**
| File | Change |
|---|---|
| `src/contexts/GoogleDriveContext.tsx` | Change `drive` scope → `drive.file` |
| `src/services/googleDriveService.ts` | Rewrite `listBizSuiteAccounts`, `findLegacyFolders`, `getOrCreateFolder`, `getOrCreateSheetsFolder` to use stored IDs instead of Drive search queries |
| `src/components/AccountSelectionModal.tsx` | Adapt account discovery flow for `drive.file` — can't search for existing folders, only create new or use already-known IDs from localStorage |

### One-line summary for user
Yes — the app can be updated to use the `drive.file` scope. The main change is that instead of discovering existing backup folders by searching Drive, the app will store folder IDs locally after first creation and use them directly on reconnect. This is a more privacy-respecting approach and users will see the narrower permission request when connecting.
