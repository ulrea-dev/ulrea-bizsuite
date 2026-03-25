
## Root Cause Analysis

### Problem 1: Operations & Todo data missing after import
The `_applyImport` in `LegacyOnboardingFlow.tsx` calls:
```typescript
importData(JSON.stringify(appData));   // → LocalStorageRepository.import() → saves to localStorage
await uploadNow(appData);              // → SupabaseStorageContext → saves JSON to Supabase Storage bucket
```

But it does NOT persist data to the **Supabase DB tables**. `uploadNow` only writes the raw JSON file to the `workspace-data` Storage bucket — it doesn't call `SupabaseDBRepository._saveAsync()`.

After import, when the app reloads and calls `loadAsync()`, it finds the `DB_MIGRATED_KEY` flag already set (`bizsuite-db-migrated-v2` in localStorage). So it skips migration and queries the **empty Supabase DB tables**, which return empty arrays for projects, todos, expenses, etc. Only the `businesses` table has data because the one-time migration ran separately.

The result: only the business record made it to the DB, not the projects/todos/expenses/etc.

### Problem 2: No way to re-trigger legacy import after the fact
Once `DB_MIGRATED_KEY` is set, there's no UI button to run the import again. Users who had partial imports can't recover.

---

## The Fix — Two Parts

### Part 1: Fix `_applyImport` to write to the Supabase DB tables

In `LegacyOnboardingFlow.tsx`, replace the current `_applyImport` implementation:

**Current (broken):**
```typescript
const _applyImport = async (appData: AppData) => {
  importData(JSON.stringify(appData));  // only goes to localStorage
  await uploadNow(appData);             // only goes to Storage bucket file
  onComplete();
};
```

**Fixed:**
The `importData` function in `BusinessContext` calls `repository.import(jsonString)` on the `SupabaseDBRepository`. Looking at the repo's `import()` method:
```typescript
import(jsonString: string): AppData {
  const local = this.local.import(jsonString);
  void this._saveAsync(local);   // ← THIS already calls _saveAsync!
  return local;
}
```

So `importData()` DOES call `_saveAsync`. The issue is that `_saveAsync` derives the `workspaceId` from `data.userSettings.accountName`. During legacy import, `accountName` is often empty or is the user's old account name — which may not match the `workspace_id` in the user's JWT metadata. This means the data gets saved to a **wrong `workspace_id`** and is invisible when queried via RLS.

**The fix**: Before calling `importData`, ensure `accountName` is set correctly in the imported data so `_deriveWorkspaceId` produces the correct workspace slug that matches the user's JWT `workspace_id`.

Additionally, we must **clear the `DB_MIGRATED_KEY` flag** before re-importing so the migration check doesn't short-circuit.

### Part 2: Add a "Re-import from Backup" card in Settings

Add a `LegacyImportCard` component (or section in `BackupSettingsCard`) that:
1. Shows a "Import from Supabase Cloud Backup" button
2. On click: scans the `workspace-data` Storage bucket for the user's JSON backup (same logic as `LegacyOnboardingFlow`)
3. If found with multiple businesses → opens `LegacyImportBusinessPickerModal`
4. If found single → imports directly with confirmation
5. Clears `DB_MIGRATED_KEY` and calls `importData()` so `_saveAsync` rewrites all tables

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/LegacyOnboardingFlow.tsx` | Fix `_applyImport`: patch `accountName` in imported data before calling `importData`, clear DB migration flag, reload DB after import |
| `src/repositories/SupabaseDBRepository.ts` | In `_runOneTimeMigration`: also try `userId` path directly (not just accountName slug). Expose a new `reimportFromBackup(data)` method that clears the flag and re-saves everything |
| `src/components/BackupSettingsCard.tsx` | Add a "Restore from Cloud Backup" section that scans Storage and lets user re-import, with the business picker for multi-business backups |

---

## Detailed Fix for `_applyImport`

```typescript
const _applyImport = async (appData: AppData) => {
  setFlowState('importing');
  try {
    // 1. Get current user to know the correct workspace_id
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    
    // 2. Patch the imported data: set accountName to the user's existing
    //    account_name from metadata (or derive one) so _deriveWorkspaceId
    //    in SupabaseDBRepository produces the correct workspace_id
    const workspaceId = user?.user_metadata?.workspace_id || user?.id || '';
    const patchedData: AppData = {
      ...appData,
      userSettings: {
        ...appData.userSettings,
        userId: user?.id || appData.userSettings.userId,
        accountName: workspaceId,  // ensures _deriveWorkspaceId returns correct ID
      },
    };
    
    // 3. Clear the migration flag so SupabaseDBRepository doesn't skip saving
    localStorage.removeItem('bizsuite-db-migrated-v2');
    
    // 4. importData calls repository.import() → _saveAsync() → writes ALL tables
    importData(JSON.stringify(patchedData));
    
    // 5. Set the flag again after successful import
    localStorage.setItem('bizsuite-db-migrated-v2', 'true');
    
  } catch (err) {
    console.error('[LegacyOnboarding] import error:', err);
  } finally {
    onComplete();
  }
};
```

## Re-import Card in BackupSettingsCard

Add a new "Restore from Cloud Backup" card:
- Button: "Scan for backup" → calls `downloadCloud(userId)` and `downloadCloud(accountName slug)` same as `LegacyOnboardingFlow`
- If backup found: shows venture count + last modified date
- "Import" button (with business picker if multiple) → runs the same patched `_applyImport` logic
- Shows success toast with counts: "Imported X projects, Y todos, Z payments"

This card lives in the "Backup" tab of Settings, below the existing Cloud Storage card.

## Summary of Root Cause (one sentence)
The imported data was saved with the wrong `workspace_id` (from the legacy backup's `accountName` rather than the current user's JWT `workspace_id`), causing all DB queries via RLS to return empty results for everything except the one business record.
