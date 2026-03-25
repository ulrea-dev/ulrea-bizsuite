
## What's Being Built

The Business Access page at `/business-management/business-access` needs a full user management system where the workspace owner can:
1. **Invite users** via email (invitation email with signup link) **or** create an account directly (email + temporary password they must change on first sign-in)
2. **Edit** user role and business access
3. **Delete** user access (revoke access from the app, optionally delete from auth)

Currently, the page just stores access data in the local JSON (via `userBusinessAccess` in `AppData`). It has no real Supabase Auth integration — it generates a random UUID and doesn't actually create auth users or send emails.

---

## Architecture

### Two invitation methods:
- **Send Invite Email**: calls `supabase.auth.admin.inviteUserByEmail()` via a new Edge Function (needs service role key). User gets an email with a "Set your password" link. On first login, they're prompted to set password + complete profile.
- **Create with Temporary Password**: calls `supabase.auth.admin.createUser()` via Edge Function with a generated temp password. Owner copies or shares the credentials. User is flagged (`force_password_change: true` in metadata) → on login, they're redirected to change password before entering the app.

Both methods create real Supabase Auth users tied to the workspace.

### New Edge Function: `manage-workspace-users`
Since `supabase.auth.admin.*` requires the service role key (never exposed client-side), all admin user actions go through this edge function:
- `POST /invite` — sends invitation email
- `POST /create` — creates user with temp password
- `DELETE /remove` — optionally deletes the Supabase Auth user (or just removes access from the JSON)

### Workspace Linking
When an invited user logs in for the first time, the existing Cloud Restore flow (`accountName` lookup in Supabase Storage) already handles loading the workspace data. The access entry in `userBusinessAccess` (stored in the JSON) is keyed by the Supabase Auth `user.id`. The Edge Function returns the new user's Supabase `user.id` so we can store it correctly in the access list.

### Force Password Change
For temp-password accounts: on login, check `user_metadata.force_password_change === true` → redirect to `/reset-password?force=1` with a UI that says "You must set a new password before continuing".

---

## Files to Change

### New Files
1. `supabase/functions/manage-workspace-users/index.ts` — Edge Function with invite, create, remove actions using service role key
2. (No new page files needed — all within BusinessAccessPage)

### Modified Files
3. `src/components/admin/BusinessAccessPage.tsx` — Full rewrite with two-tab dialog (Invite by email | Create with password), status badges (Pending/Active), improved user list with avatar initials, inline edit, delete with confirmation
4. `src/pages/ResetPasswordPage.tsx` — Add `force=1` detection: show "Set your new password" heading + block navigation back until done
5. `src/components/Auth.tsx` — After login, check `user_metadata.force_password_change` → redirect to `/reset-password?force=1`

---

## UI Details for BusinessAccessPage

### "Grant Access" Dialog — Two Tabs

```
[  Send Invite Email  |  Create Account  ]

--- Send Invite Email tab ---
Email: [input]
Role: [select: Viewer / Admin / Owner]
Businesses: [checkbox list]
[Cancel] [Send Invitation]

--- Create Account tab ---
Email: [input]
Temporary Password: [auto-generated, show/hide, copy button]
Display Name: [input, optional]
Role: [select]
Businesses: [checkbox list]
[Cancel] [Create Account]
```

### User List Enhancements
- Avatar with initials (from email)
- Status badge: `Pending` (invited, not yet logged in) | `Active` (has logged in)
- Business names listed below email
- Edit icon → opens edit dialog (same fields minus email)
- Trash icon → confirmation dialog with option to also delete from system

### Status Detection
Store `inviteStatus: 'pending' | 'active'` in the `UserBusinessAccess` object (already in the type). Set to `pending` on creation, update to `active` when the user logs in (checked against Supabase Auth — the Edge Function can query if the user has `email_confirmed_at`).

---

## Technical Steps

1. **Edge Function** `manage-workspace-users/index.ts`:
   - Uses `SUPABASE_SERVICE_ROLE_KEY` secret (already configured)
   - `action: 'invite'` → `adminAuthClient.inviteUserByEmail(email, { data: { workspace_invite: true } })` → returns `{ userId, email }`
   - `action: 'create'` → `adminAuthClient.createUser({ email, password, email_confirm: true, user_metadata: { force_password_change: true } })` → returns `{ userId, email }`
   - `action: 'remove'` → optionally `adminAuthClient.deleteUser(userId)` based on `deleteFromAuth` flag
   - `action: 'check_status'` → queries user by ID, returns `email_confirmed_at` to determine `pending/active` status

2. **BusinessAccessPage.tsx** — calls the edge function, then dispatches `UPDATE_USER_BUSINESS_ACCESS` with the real Supabase `userId` returned from the edge function

3. **Auth.tsx** — After successful login, add check:
   ```typescript
   if (data.user?.user_metadata?.force_password_change) {
     navigate('/reset-password?force=1');
   }
   ```

4. **ResetPasswordPage.tsx** — Detect `?force=1`, change heading to "Set your permanent password", call `supabase.auth.updateUser({ password })` then `supabase.auth.updateUser({ data: { force_password_change: false } })` before proceeding

---

## UserBusinessAccess Type Extension
Add `inviteStatus?: 'pending' | 'active'` and `displayName?: string` to the `UserBusinessAccess` interface in `types/business.ts`.
