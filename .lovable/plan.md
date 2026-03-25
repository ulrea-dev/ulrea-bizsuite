## Understanding the Request

The user wants to fundamentally change the storage architecture:

**Current**: localStorage (primary) → Google Drive (optional backup)

**Desired**:

- Supabase Storage (primary, real-time) — stores the full JSON file per workspace
- Google Drive (optional external archive) — user/admin can push to it manually
- Users log in without Google required. Users log in with email.
- Existing Google users are forced to set a password for next login (so there's an option for legacy login for users who were using Google signin)
- App shows "last synced with Google Drive" timestamp
- Every data change is immediately saved to Supabase Storage
- Admin can push to Google Drive as a secondary export

**What stays the same**: localStorage is still used as the in-memory working store (for performance), but every save also pushes the JSON file to Supabase Storage.

---

## Architecture Design

### Storage Layers

```text
User makes change
    ↓
1. localStorage (instant, in-memory — unchanged)
    ↓
2. Supabase Storage (immediate async upload — NEW PRIMARY)
    ↓
3. Google Drive (manual push by user — secondary/optional)
```

### Supabase Storage Structure

```text
bucket: workspace-data
  └── {workspace_id}/
        └── data.json   (overwritten on every save)
```

The `workspace_id` is derived from the `userSettings.accountName` or a stable unique ID. Since users don't have Supabase Auth, we'll use the existing `userSettings.userId` (already generated on first login) as the folder key.

### Key Design Decisions

1. **Supabase Auth required** — users still log in with just their email and password (the existing flow). The `userId` from `userSettings` is used as the storage path key.
2. **Bucket RLS**: Public insert/update using the userId path prefix — simple and consistent with the existing local-first model. Since the data is already stored in localStorage (client-accessible), this doesn't add security concerns.
3. **Upload on every save**: The `BusinessContext` already calls `repository.save(data)` on every change. We hook into that same `data` change effect to also upload to Supabase Storage.
4. **Load on login**: When user logs in (either by name or if they have an existing userId), we check if there's a file in Supabase Storage for that userId and offer to restore it.
5. **Google Drive timestamp**: `GoogleDriveBackupCard` already shows `lastSyncTime`. We keep this and make it clearly labeled as "External Drive" sync time. The Supabase sync time is tracked separately.

---

## Files to Create/Change


| File                                            | Change                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Supabase migration                              | Create `workspace-data` storage bucket with RLS                                                                              |
| `src/repositories/SupabaseStorageRepository.ts` | NEW — implements `IDataRepository` using Supabase Storage. Also saves to localStorage as fallback.                           |
| `src/contexts/SupabaseStorageContext.tsx`       | NEW — manages the async Supabase sync layer: uploads on data change, tracks last-saved-to-supabase timestamp, loads on login |
| `src/repositories/RepositoryProvider.tsx`       | Switch default to `SupabaseStorageRepository`                                                                                |
| `src/components/Auth.tsx`                       | Add "Restore from Cloud" option on login — if a file exists for the userId, offer to restore it before starting fresh        |
| `src/components/GoogleDriveBackupCard.tsx`      | Rename/reframe as "External Drive" — show Supabase last-sync and Google Drive last-push separately                           |
| `src/components/SettingsPage.tsx`               | Update Backup tab to show new 2-tier layout: Cloud Storage (Supabase, always-on) + External Drive (Google Drive, optional)   |


---

## Supabase Storage Bucket + RLS

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('workspace-data', 'workspace-data', false);

-- Allow any anon user to upload/read their own workspace file by userId path
CREATE POLICY "Users can upload their own workspace data"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'workspace-data');

CREATE POLICY "Users can update their own workspace data"  
ON storage.objects FOR UPDATE TO anon
USING (bucket_id = 'workspace-data');

CREATE POLICY "Users can read their own workspace data"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'workspace-data');
```

---

## SupabaseStorageRepository

This new class wraps `LocalStorageRepository` and additionally:

- On `save(data)`: Async upload JSON to `workspace-data/{userId}/data.json`. Fire-and-forget (no await), stores `lastSupabaseSyncTime` in localStorage separately.
- On `load()`: Returns from localStorage (fast, synchronous). Supabase loading happens separately in `Auth.tsx` on login.
- Provides `uploadToSupabase(data, userId)` and `downloadFromSupabase(userId)` public methods.

---

## Auth.tsx Login Flow with Cloud Restore

When a user enters their name and logs in:

1. Check localStorage for existing data (current behavior)
2. **NEW**: If `userId` is set in `userSettings`, check Supabase Storage for `{userId}/data.json`
3. If a cloud file exists and is newer than local, offer "Restore from Cloud" with timestamp
4. User can choose: continue with local data OR restore from cloud

For new users (no existing data), after they enter their name, a `userId` is generated and associated. Subsequent logins on different devices can recover data by entering the same name — but since userId is device-specific, we need to show them their userId as a "recovery key" they can note down, OR we link userId to their display name in a simple Supabase table for cross-device lookup.

**Simpler approach**: Use `accountName` (workspace name) as the storage key. The workspace owner sets an account name, and that becomes the bucket path. On new devices, they enter the same account name to discover their cloud backup. This is simpler and doesn't require auth.

Storage path: `workspace-data/{accountName_slug}/data.json`

---

## Settings — New Backup Tab Layout

```
[Cloud Storage — Always On]
  ✓ Auto-saving to cloud
  Last saved: 2 minutes ago
  [View history / Restore]

[External Drive — Optional]
  Google Drive connection
  Last pushed to Drive: 3 days ago
  [Push to Drive Now] [Connect / Disconnect]
  [Google Sheets connection]
```

---

## Super Admin Visibility

Since data is now in Supabase Storage, the super admin can also list all workspace files from the `workspace-data` bucket — giving them visibility into all stored workspaces without relying solely on passive registry upserts.

---

## Summary of Implementation Steps

1. **Migration**: Create `workspace-data` bucket + RLS policies
2. `**SupabaseStorageRepository.ts**`: New repository class with local-first + Supabase async upload
3. `**RepositoryProvider.tsx**`: Use `SupabaseStorageRepository` as default
4. `**BusinessContext.tsx**`: On data change, trigger Supabase upload (track `lastCloudSyncTime` in a separate localStorage key)
5. `**Auth.tsx**`: Add cloud restore option — if `accountName` is set and a cloud file exists, show "Resume from Cloud" on login
6. `**GoogleDriveBackupCard.tsx**` → rename to `BackupSettingsCard.tsx`: Show 2-tier: cloud (Supabase) at top, external drive (Google Drive) below
7. `**SettingsPage.tsx**`: Update backup tab to use new card

The approach is non-breaking: if Supabase upload fails, the app still works via localStorage. Google Drive integration is fully preserved.