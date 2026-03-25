
## Plan: Super Admin Panel + Build Error Fixes

### Part 1 — Fix the 4 existing build errors first

**Error 1** — `ExtraPaymentModal.tsx:153` — `formData` type is missing `paymentDate`. The `paymentDate` is tracked separately via `setPaymentDate` state but `formData` type doesn't include it. Fix: the line `paymentDate: formData.paymentDate` should use the separate `paymentDate` state variable (which already exists as `paymentDate.toISOString().split('T')[0]`).

**Error 2 & 3** — `HubLayout.tsx:69-70` — `onCreateAccount` and `onMigrateLegacy` props on `AccountSelectionModal` expect `Promise<void>` but the context returns `Promise<BizSuiteAccount>`. Fix: Update `AccountSelectionModal` prop interface to accept `Promise<BizSuiteAccount>` OR wrap the calls in `HubLayout` to discard the return value.

**Error 4** — `LocalStorageRepository.ts:119` — duplicate `renewals` key in object literal (line ~62 has `renewals: []` and line ~119 also assigns `renewals`). Fix: remove the duplicate from `getInitialData()`.

---

### Part 2 — Super Admin Panel

**Architecture: Supabase-backed, fully isolated from the main app**

The super admin area uses Supabase Auth for login (the `dev@ulrea.com` account) and a Supabase database table to store workspace registry data. This is completely separate from the regular app login (which uses localStorage username).

**How workspace data is collected:**
When any WorkOS user connects Google Drive and creates/verifies their workspace, the app will register a lightweight record in Supabase (`workspaces` table): workspace name, owner email, owner display name, folder ID, and last active timestamp. Team members are also registered in a `workspace_members` table when they access a shared workspace. This is a passive background registration — it doesn't affect the existing app behaviour.

**Super admin reads:**
- All registered workspaces
- For each workspace: the owner, team members, and last sync time
- Platform-level stats: total workspaces, total users, active in last 30 days

---

### Database Schema (Supabase migration)

```sql
-- Workspace registry (populated by app on connect/sync)
CREATE TABLE public.workspace_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id text UNIQUE NOT NULL,
  workspace_name text NOT NULL,
  owner_email text,
  owner_display_name text,
  last_sync_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Workspace members (populated when users access a shared workspace)
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_folder_id text NOT NULL REFERENCES public.workspace_registry(folder_id) ON DELETE CASCADE,
  member_email text,
  member_display_name text,
  role text DEFAULT 'member',
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(workspace_folder_id, member_email)
);

-- Super admin role table
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

RLS:
- `workspace_registry` and `workspace_members`: public INSERT (upsert from app), SELECT restricted to super admins only
- `super_admins`: SELECT restricted to the authenticated user's own row

---

### Files to Create/Edit

| File | Action |
|---|---|
| `src/components/ExtraPaymentModal.tsx` | Fix build error: use `paymentDate` state variable |
| `src/layouts/HubLayout.tsx` | Fix build error: wrap `createAccount`/`migrateAccount` to return void |
| `src/repositories/LocalStorageRepository.ts` | Fix build error: remove duplicate `renewals` key |
| `src/pages/SuperAdminLoginPage.tsx` | New — isolated login page with Supabase Auth |
| `src/pages/SuperAdminDashboard.tsx` | New — dashboard: workspace list, user counts, search |
| `src/components/superadmin/WorkspaceTable.tsx` | New — table of all workspaces with expandable team members |
| `src/components/superadmin/StatsCards.tsx` | New — platform totals: workspaces, users, active |
| `src/layouts/SuperAdminLayout.tsx` | New — isolated sidebar layout, no ThemeProvider conflict |
| `src/hooks/useSuperAdmin.ts` | New — auth check, redirect if not super admin |
| `src/contexts/GoogleDriveContext.tsx` | Add passive workspace registry upsert on connect/sync |
| `src/App.tsx` | Add `/super-admin` and `/super-admin/dashboard` routes (outside ProtectedRoute) |

---

### Super Admin Login Flow

1. User navigates to `/super-admin`
2. Supabase email/password sign-in (completely separate from main app username login)
3. After sign-in, check `super_admins` table for their `user_id` — if not found, show "Unauthorized" and sign out
4. If authorized, redirect to `/super-admin/dashboard`
5. Dashboard shows all workspaces from `workspace_registry` with expandable team members from `workspace_members`

The first super admin record (`dev@ulrea.com`) is seeded via a Supabase migration that runs an INSERT after the account is created in Supabase Auth.

---

### Passive Registry (non-breaking)
In `GoogleDriveContext.tsx`, on `createAccount` and `discoverAccounts` success, a fire-and-forget `fetch` to Supabase upserts the workspace. Uses `anon` key — RLS allows INSERT but not SELECT (except super admins). No await, no user-visible side effects, no errors shown if it fails.

---

### UI Design
The super admin panel will use a clean, minimal dark sidebar layout distinct from the main WorkOS theme — professional "admin console" aesthetic with:
- Left sidebar: WorkOS logo, nav items (Overview, Workspaces, Users), Logout
- Main area: stat cards at top, searchable workspace table below
- Each workspace row is expandable to show team members
