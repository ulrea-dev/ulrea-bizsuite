
## Current Architecture Analysis

The app currently uses a **username-only login** — no email, no password, no Supabase Auth for regular users. The only Supabase Auth used is for the Super Admin.

The user wants to:
1. Switch the main app login to **Supabase Auth (email + password)**
2. Detect on login if the user has a Supabase Auth account — if not (Google Drive legacy user), force them to set a password using their Google email
3. Allow users to **reset/change password** via email
4. After login, force a **profile setup** if the user hasn't filled in Display Name and Account Name yet
5. The Google email automatically becomes the user's email when they set up via Google

---

## Architecture Shift

```text
BEFORE: username stored in localStorage → ProtectedRoute checks localStorage

AFTER:  email + password → Supabase Auth session → ProtectedRoute checks auth session
        localStorage data still keyed to userId (now = Supabase Auth user.id)
```

The `userSettings.username` stays (it's the display name, not the login credential). What changes:
- Login uses Supabase email/password instead of just a name field
- `ProtectedRoute` checks Supabase session, not just `username`
- After auth, check if profile is complete (username + accountName set), if not show profile setup modal

---

## Google Legacy Users Flow

Google Drive connects with `settings.connectedEmail` (already stored in `GoogleDriveSettings`). When a Google user logs in for the first time post-migration:

1. They see the new email/password login
2. A "Continue with Google" path: user clicks it → Google OAuth connects → app gets the email from the Google connection → checks Supabase if that email exists
3. If **no Supabase account** → show "Set a password for your account" screen with the pre-filled email
4. After password set, they're registered in Supabase Auth and logged in
5. Profile setup modal appears since `username` may be empty

---

## Files to Create / Edit

| File | Change |
|---|---|
| `src/components/Auth.tsx` | Full rewrite: email + password login form, sign up form, forgot password form. Remove username-only flow. |
| `src/pages/LoginPage.tsx` | Wrap new Auth with Supabase session check — if session exists, redirect to `/dashboard` |
| `src/components/ProtectedRoute.tsx` | Check Supabase session (`supabase.auth.getSession()`) instead of just `data.userSettings.username` |
| `src/components/ProfileSetupModal.tsx` | NEW — Modal triggered post-login if `username` or `accountName` is missing. Required fields: Display Name, Account Name. Cannot be dismissed without completing. |
| `src/layouts/DashboardLayout.tsx` / `HubLayout.tsx` | Add `ProfileSetupModal` check — if user logged in but profile incomplete, show modal |
| `src/pages/ResetPasswordPage.tsx` | NEW — `/reset-password` route that handles Supabase recovery token from email link |
| `src/App.tsx` | Add `/reset-password` public route |
| `src/contexts/BusinessContext.tsx` | On login, key the localStorage data by Supabase `user.id` rather than just username |

---

## Login Screen Design

```text
[WorkOS Logo]

Sign in to WorkOS

Email _______________
Password _______________

[Sign In]

[Forgot password?]

─── or ───

[Continue with Google] (connects Google OAuth, sets password if new)

Don't have an account? Sign up
```

---

## Profile Setup Modal (Post-Login)

Triggered whenever user is authenticated (Supabase session exists) but:
- `data.userSettings.username` is empty, OR
- `data.userSettings.accountName` is empty

```text
╔══════════════════════════════════╗
║  Set Up Your Profile             ║
║                                  ║
║  Email: user@email.com (locked)  ║
║                                  ║
║  Display Name ___________        ║
║  (Your name, shown to teammates) ║
║                                  ║
║  Account / Workspace Name ______ ║
║  (Name of this workspace)        ║
║                                  ║
║  [Continue]                      ║
╚══════════════════════════════════╝
```

Cannot be dismissed. Saved to `userSettings` via dispatch.

---

## Google Legacy → Password Setup Flow

1. User clicks "Continue with Google" on login screen
2. Google OAuth connects → `settings.connectedEmail` is populated
3. App calls `supabase.auth.getUserByEmail(email)` equivalent — actually: attempt sign-in with no password fails → detect no account
4. More reliable approach: After Google connect, call `supabase.auth.signUp({ email: googleEmail, password: '' })` — if returns `user already exists` → do normal sign-in; if new user → show "Create your password" screen
5. On password creation: `supabase.auth.signUp({ email, password })` or `supabase.auth.updateUser({ password })` if already signed in

---

## Password Reset Flow

1. User clicks "Forgot password?" on login
2. Email input + "Send reset link" button
3. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.origin + '/reset-password' })`
4. Toast: "Check your email for a reset link"
5. `/reset-password` page: detects `type=recovery` in URL hash → shows new password form → calls `supabase.auth.updateUser({ password })`

---

## Change Password (Inside App)

In `SettingsPage.tsx`, Account tab, add a "Security" card:
- "Change Password" button → small form: Current Password (optional for OAuth users), New Password, Confirm New Password
- Calls `supabase.auth.updateUser({ password: newPassword })`

---

## ProtectedRoute Update

```typescript
// Check BOTH Supabase session AND local username
const session = await supabase.auth.getSession();
if (!session.data.session) → redirect to /login
```

Using `onAuthStateChange` in a new `AuthContext` or directly in `ProtectedRoute` with a loading state.

---

## Summary of Steps

1. Create `src/components/ProfileSetupModal.tsx` — forced profile completion after login
2. Create `src/pages/ResetPasswordPage.tsx` — handles email recovery links
3. Rewrite `src/components/Auth.tsx` — email + password + forgot password + Google path with forced password setup
4. Update `src/components/ProtectedRoute.tsx` — check Supabase session
5. Update `src/pages/LoginPage.tsx` — redirect if session exists
6. Update `src/App.tsx` — add `/reset-password` public route
7. Update `src/components/SettingsPage.tsx` — add Security card with Change Password

The Supabase `user.id` (from auth session) becomes the storage key for the workspace data, replacing the old `userId` in `userSettings`. This is more reliable and works across devices naturally.
