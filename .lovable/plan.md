
## Root Cause Analysis

The problem has **two separate but related issues**:

### Issue 1 — Invited users load the workspace owner's data (full access)
When an invited user logs in:
1. `LocalStorageRepository.load()` reads from `localStorage` (key: `bizsuite-data`)
2. Their `localStorage` is either **empty** (new device) or contains **their own unrelated data**
3. Their `userSettings.userId` is blank/stale — it is never set to their Supabase `user.id` after login
4. The `getUserAccessibleBusinessIds` function in `filterDataForUser.ts` checks `data.userBusinessAccess` using this `userId` — but since `userId` is blank, it finds **no match** and falls through to the backward-compat default: **return all businesses**

### Issue 2 — Invited users are never loaded into the workspace owner's dataset
The workspace data (including the `userBusinessAccess` list) lives in the **owner's** Supabase Storage path (keyed by their `accountName`). An invited user has a **blank localStorage** — the app never downloads the owner's workspace for them.

There is no "join workspace" mechanism — invited users need to load the owner's workspace data from Supabase Storage and apply the access filter for their own `userId`.

---

## The Fix — Three-Part Solution

### Part 1: Set `userId` to Supabase auth `user.id` on login
In `HubLayout.tsx` (where the user lands post-login), after fetching the Supabase session, dispatch `SET_USER_ID` with the actual Supabase `user.id`. This ensures the `userId` in `userSettings` is always the real auth identity — not blank.

### Part 2: Detect if user is an "invited user" (not workspace owner)
After setting `userId`, check if the user is listed in `userBusinessAccess` **inside the currently loaded workspace**. But since an invited user has blank localStorage, we need to **scan Supabase Storage** for workspaces where their `userId` appears in the `userBusinessAccess` array.

The flow:
1. User logs in → `userId` set to `user.id`
2. Check if `data.userSettings.userId === user.id` AND `data.businesses.length > 0` → **this is the owner**, no action needed
3. If `data.businesses.length === 0` OR `userId` just changed → **scan Supabase Storage** for the user's workspace
4. Use the existing `downloadCloud` to fetch the workspace by the `accountName` stored in Supabase user metadata (`account_name`)
5. If found and the user's `userId` is in `userBusinessAccess` → load that workspace and apply the access filter

### Part 3: Apply access filter when loading data for non-owners
When a non-owner loads a workspace, `filterDataForUser` already handles filtering — but it needs to be applied **at load time** not just at render time. The `accessibleBusinesses` in `BusinessContext` already does this via `getUserAccessibleBusinessIds`, but the **full unfiltered data** is still in state.

The real fix: after loading the workspace for an invited user, strip the data to only what they're allowed to see using `filterDataForUser` before dispatching `LOAD_DATA`.

---

## Files to Change

### 1. `src/layouts/HubLayout.tsx`
Add a `useEffect` that:
- Gets Supabase session `user.id`
- Dispatches `SET_USER_ID` with the real auth user ID
- If `data.businesses.length === 0` (blank state — invited user on a new device), tries to load the workspace from Supabase Storage using the `account_name` from user metadata
- Alternatively: check if `user.id` appears in the stored `userBusinessAccess` of a downloaded workspace; if yes, filter and load it

### 2. `src/utils/filterDataForUser.ts`
Fix `getUserAccessibleBusinessIds` to be **strict for invited users** — only grant full access if:
- The `userBusinessAccess` array is empty (true blank slate, not "user not found")  
- OR the user's entry explicitly has all businesses

Change the fallback logic so that if `userBusinessAccess` has entries but the user is not in it, return **empty array** (no access) rather than all businesses.

### 3. `src/components/ProfileSetupModal.tsx`
When `needsProfileSetup` is true for an **invited user** (they have `userId` set but no `username`):
- Show a simpler modal with just "Set your display name" (no workspace name — they're joining someone else's workspace)
- Skip the workspace name field if the user is an invited user (i.e., they appear in `userBusinessAccess`)

### 4. `src/components/admin/BusinessAccessPage.tsx` (minor)
When the owner saves the workspace data (which includes `userBusinessAccess`), also save the `workspaceId` (owner's `userId` / storage path) in the invited user's Supabase auth metadata via the edge function. This allows invited users to look up whose workspace to join.

The edge function already has access to the invited user — when creating/inviting, also call `adminClient.auth.admin.updateUserById(userId, { user_metadata: { workspace_id: ownerId } })`.

---

## Detailed Flow After Fix

```
Invited user logs in →
  ProtectedRoute: session valid ✓ →
  HubLayout mounts →
    1. Get user.id from Supabase session
    2. Dispatch SET_USER_ID(user.id)  
    3. Check user_metadata.workspace_id (set by owner when granting access)
    4. If workspace_id exists → downloadCloud(workspace_id path)
    5. Loaded workspace has userBusinessAccess with this user's entry
    6. Apply filterDataForUser(loadedData, user.id)
    7. Dispatch LOAD_DATA(filteredData)
    8. User sees only their assigned businesses ✓
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/layouts/HubLayout.tsx` | Sync `userId`, detect invited user via `user_metadata.workspace_id`, download and filter workspace |
| `src/utils/filterDataForUser.ts` | Fix fallback — empty access list = no access (not all access) for non-owner users |
| `supabase/functions/manage-workspace-users/index.ts` | When inviting/creating, save `workspace_id` to invited user's Supabase metadata |
| `src/components/ProfileSetupModal.tsx` | Skip workspace name field for invited users (they're joining, not creating) |
