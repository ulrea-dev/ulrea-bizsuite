

## Plan: Fix Backup and Sync Failures After Account-Based System Implementation

### Root Causes Identified

1. **Query Encoding Issue**: The `getOrCreateFolder()` fallback query is NOT URL-encoded, potentially causing API errors
2. **Missing Account Migration Flow**: Existing connected users don't have `currentAccountId`/`backupFolderId` in their settings, so `currentAccount` is never set, causing sync to fail
3. **Silent Fallback Failures**: When `getOrCreateFolder()` falls back to searching, it may find folders the user can see but can't write to (shared folders without Editor access)

---

### Solution Overview

1. **Fix query encoding** in `getOrCreateFolder()` fallback
2. **Add migration detection** on app load for connected users without a workspace selected
3. **Auto-trigger account discovery** for existing users who are connected but don't have an account set
4. **Improve permission checking** to ensure we only return folders we can actually write to

---

### Part 1: Fix Query Encoding in getOrCreateFolder

**File: `src/services/googleDriveService.ts`** (line 224-226)

The fallback query needs to be URL-encoded like other methods:

```typescript
private async getOrCreateFolder(): Promise<string> {
  if (this.currentAccountFolderId) {
    return this.currentAccountFolderId;
  }

  // Encode the query properly
  const query = encodeURIComponent(
    `name contains '${FOLDER_NAME_PREFIX}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchResponse = await this.request(
    `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name,ownedByMe,capabilities/canAddChildren)`
  );
  // ... rest of the logic
}
```

---

### Part 2: Auto-Trigger Account Discovery for Connected Users Without Workspace

**File: `src/contexts/GoogleDriveContext.tsx`**

Add a new `useEffect` that detects when a user is connected but has no workspace selected, and automatically triggers account discovery:

```typescript
// Detect connected users who need to select/migrate a workspace
useEffect(() => {
  // User is connected but has no account selected
  if (isConnected && !settings.currentAccountId && !showAccountSelection && !isDiscoveringAccounts) {
    // Trigger account discovery - this will show the selection modal
    discoverAccounts();
  }
}, [isConnected, settings.currentAccountId, showAccountSelection, isDiscoveringAccounts, discoverAccounts]);
```

This ensures:
- Existing users who connect see the workspace selection modal
- New users who just authenticated see it too
- Users who already have a workspace selected skip this

---

### Part 3: Improve Fallback Logic with Better Permission Checking

**File: `src/services/googleDriveService.ts`**

The fallback should be more robust - if it finds folders but none are writable, the error message should guide the user:

```typescript
private async getOrCreateFolder(): Promise<string> {
  if (this.currentAccountFolderId) {
    return this.currentAccountFolderId;
  }

  const query = encodeURIComponent(
    `name contains '${FOLDER_NAME_PREFIX}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchResponse = await this.request(
    `${DRIVE_API_BASE}/files?q=${query}&fields=files(id,name,ownedByMe,capabilities/canAddChildren)`
  );
  const searchData = await searchResponse.json();

  if (searchData.files && searchData.files.length > 0) {
    // Priority 1: Folder we own
    const ownedFolder = searchData.files.find((f: any) => f.ownedByMe);
    if (ownedFolder) {
      return ownedFolder.id;
    }
    
    // Priority 2: Shared folder with write access
    const writableFolder = searchData.files.find((f: any) => f.capabilities?.canAddChildren === true);
    if (writableFolder) {
      return writableFolder.id;
    }
    
    // Folders exist but none are writable - provide clear error
    throw new Error(
      'You have access to a BizSuite folder but cannot write to it. ' +
      'Please ask the folder owner to give you Editor access, or select a different workspace.'
    );
  }

  throw new Error('No workspace selected. Please select or create a workspace first.');
}
```

---

### Part 4: Update syncNow to Handle Missing Account Gracefully

**File: `src/contexts/GoogleDriveContext.tsx`**

Currently `syncNow` silently returns if no account is set. Change it to show a helpful message:

```typescript
const syncNow = useCallback(async (data: AppData) => {
  if (!isConnected) return;
  
  // If no account selected, trigger discovery
  if (!currentAccount) {
    toast({
      title: 'Workspace Required',
      description: 'Please select or create a workspace first.',
    });
    discoverAccounts();
    return;
  }
  
  setIsSyncing(true);
  // ... rest of sync logic
}, [isConnected, currentAccount, discoverAccounts, updateSettings, toast, handleTokenExpiry]);
```

---

### Files Changed Summary

| File | Changes |
|------|---------|
| `src/services/googleDriveService.ts` | URL-encode query in `getOrCreateFolder()`, improve error messages |
| `src/contexts/GoogleDriveContext.tsx` | Add auto-discovery effect for connected users, update `syncNow` to handle missing account |

---

### Flow After Fix

```text
User loads app (already connected, no workspace set)
    |
    v
useEffect detects: isConnected=true, currentAccountId=null
    |
    v
discoverAccounts() is called automatically
    |
    v
Account Selection Modal appears
    |
    v
User selects existing workspace or creates new one
    |
    v
currentAccount is set, folder ID is stored
    |
    v
Backup works correctly, sync works correctly
```

---

### Technical Details

**Query Encoding Fix (Critical)**:
```diff
- `${DRIVE_API_BASE}/files?q=name contains '${FOLDER_NAME_PREFIX}' and ...`
+ const query = encodeURIComponent(`name contains '${FOLDER_NAME_PREFIX}' and ...`);
+ `${DRIVE_API_BASE}/files?q=${query}&fields=...`
```

**Auto-Discovery Effect**:
- Only triggers once when conditions are met
- `isDiscoveringAccounts` flag prevents multiple triggers
- Works for both fresh page loads and reconnections

**Sync Improvements**:
- Users get feedback when workspace is missing
- Account selection is triggered automatically
- No more silent failures

