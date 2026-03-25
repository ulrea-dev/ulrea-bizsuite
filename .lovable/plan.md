
## Analysis of Current Architecture

**Current model**: One workspace (Supabase auth user) → many `businesses[]` in `AppData`. All entities (projects, clients, payments, etc.) have a `businessId` field to identify which business they belong to.

**Requested model**: One workspace = One venture (business). Creating a second venture = creating a new Supabase workspace (separate auth+data space).

**Terminology change**: "Business" → "Venture" throughout the UI (labels, headings, buttons). The data type `Business` keeps its name internally to avoid a massive refactor, but all user-facing strings say "Venture."

---

## What This Actually Means

The Supabase DB architecture already supports this well — every table has `workspace_id`. Currently, one workspace can hold **multiple** businesses, each with a different `id` but same `workspace_id`. 

The shift to "one venture per workspace" means:

1. **UI constraint**: A workspace can only have 1 business record. Creating a "new venture" creates a **new Supabase workspace** (new `accountName`, new storage path, new `workspace_id`). The user switches between ventures by switching their auth workspace context.

2. **`currentBusinessId` becomes implicit**: Since there's exactly one business per workspace, `currentBusiness` is always `businesses[0]`. No more business switcher dropdown.

3. **Back Office**: No longer shows a "Businesses" management page (since there's only one venture per workspace). That page is replaced with a "Venture Settings" page for editing the single venture's name/currency/balance.

4. **"Venture Switcher"** replaces the "Business Switcher": Users can see all their workspaces (ventures) and switch between them. Switching workspace = switching `accountName` + reloading data from that workspace's DB tables.

5. **Existing users with multiple businesses**: Each business automatically gets its own workspace. We create new workspace entries for each business they have beyond the first, and migrate their data.

---

## Scope of Changes

### Phase 1 — Constraint + UI Rename (Primary Work)

**A. `AppSidebar.tsx` — Remove BusinessSwitcher**
Replace the `BusinessSwitcher` dropdown (which listed all businesses in the workspace) with a simple "Venture Name" display showing the single current venture.

**B. New `VentureSwitcher` component**
Shows the current venture name + a "Switch / Create Venture" option that:
- Lists other workspaces (fetched from the `workspaces` DB table where `owner_user_id = auth.uid()`)
- "Create New Venture" → opens VentureSetup (renamed BusinessSetup) which creates a new workspace record + business in that new workspace context
- Placed in the Hub sidebar or as a top-level element in the app

**C. `BusinessSetup.tsx` → `VentureSetup.tsx`**
Rename all "Business" labels to "Venture". This form now also creates the workspace record, not just a business. After creating a venture, the user is directed to switch to it.

**D. `BusinessManagement.tsx` / `BusinessesPage.tsx`**
Replace the "Businesses" section in Back Office with "Venture Settings" — a simple edit form for the single venture's name, type, currency, balances. Remove the ability to add more businesses from here (that's now done via the VentureSwitcher).

**E. `AdminSidebar.tsx`**
Replace "Businesses" nav item with "Venture Settings".

**F. `BusinessAccessPage.tsx`**  
Rename "Business Access" → "Venture Access". The "select businesses to grant" checkbox list is removed (since there's only 1 venture per workspace, access = all-or-nothing per role). Simplify to just: email, role (viewer/admin), and invite/create buttons.

**G. `WorkOSHub.tsx`**
Replace `currentBusiness?.name` references with the venture name. Update greeting/welcome text.

**H. `ProfileSetupModal.tsx`**
"Workspace Name" label → "Venture Name".

**I. Terminology sweep** across components:
- "Business" → "Venture" in all visible UI strings
- "businesses" headings, buttons, descriptions
- Page titles, toast messages, card descriptions

### Phase 2 — Venture Switching Mechanism

**New `VentureContext` (or extend `BusinessContext`)**
Add a `switchVenture(workspaceAccountName: string)` function that:
1. Calls `SupabaseDBRepository.loadAsync()` with a different `workspace_id` context
2. Dispatches `LOAD_DATA` with the new venture's data
3. Persists the active workspace selection in `localStorage` (`active-venture-account-name`)

The Supabase RLS `get_user_workspace_id()` function returns `user_metadata.workspace_id`. For owners with multiple ventures, we need to update their JWT metadata `workspace_id` when switching. This is done by calling `supabase.auth.updateUser({ data: { workspace_id: newWorkspaceId } })` then re-fetching the session.

**`workspaces` table** (already exists in DB):
- `owner_user_id` (uuid)
- `account_name` (text) — the workspace slug / `workspace_id`
- `workspace_name` (text)

When a user creates a venture, a record is inserted here. The VentureSwitcher queries `SELECT * FROM workspaces WHERE owner_user_id = auth.uid()` to list all ventures.

### Phase 3 — Existing User Migration

In `SupabaseDBRepository.loadAsync()`, add a one-time migration check:
- If user has more than 1 business in the `businesses` table, for each additional business:
  1. Create a new `workspaces` record with a derived `account_name` (e.g., `userId-business-{idx}`)
  2. The user is shown a "You have multiple ventures — we've separated them into individual workspaces" banner
  3. Data for each business (projects, clients, payments all filtered by `businessId`) is already in the DB — the user can switch between ventures and only see the relevant data once the `workspace_id` scoping is enforced per venture

For now, the simplest migration approach: **display a "Migrate Ventures" prompt** if `data.businesses.length > 1`. The user clicks it to trigger auto-migration, which creates separate workspace records and re-tags all data.

---

## Files to Change

| File | Change |
|------|--------|
| `src/types/business.ts` | No type changes; add `VentureWorkspace` interface |
| `src/components/BusinessSetup.tsx` | Rename labels "Business" → "Venture", also creates `workspaces` DB record |
| `src/components/BusinessSwitcher.tsx` | Replace with `VentureSwitcher.tsx` — lists workspaces from DB, "Create Venture" button |
| `src/components/AppSidebar.tsx` | Swap `BusinessSwitcher` for `VentureSwitcher` |
| `src/components/WorkOSHub.tsx` | Update greeting/text, "Operations" still scoped to current venture |
| `src/components/BusinessManagement.tsx` | Simplify to "Venture Settings" — single edit form, no add/delete of businesses |
| `src/components/admin/BusinessesPage.tsx` | Rename to `VentureSettingsPage.tsx`, single-venture edit |
| `src/components/admin/AdminSidebar.tsx` | "Businesses" → "Venture Settings" nav item |
| `src/components/admin/BusinessAccessPage.tsx` | "Business Access" → "Venture Access", remove per-business checkbox, simplify |
| `src/components/ProfileSetupModal.tsx` | "Workspace Name" → "Venture Name" |
| `src/components/MultiBusinessOverview.tsx` | Removed / not shown (ventures are now workspace-level) |
| `src/contexts/BusinessContext.tsx` | Add `switchVenture()`, ensure `currentBusiness` is always `businesses[0]` |
| `src/repositories/SupabaseDBRepository.ts` | `loadAsync()` uses `workspace_id`; add `createWorkspace()` helper |
| `src/App.tsx` | Update route for `BusinessesPage` → `VentureSettingsPage` |

---

## Technical Detail: Venture Switching

```text
User clicks "Switch Venture" in VentureSwitcher
  → calls switchVenture(targetAccountName)
  → supabase.auth.updateUser({ data: { workspace_id: targetAccountName } })
  → supabase.auth.refreshSession() — so JWT has new workspace_id
  → SupabaseDBRepository.loadAsync() — DB queries now use new workspace_id via RLS
  → dispatch(LOAD_DATA, newVentureData)
  → UI updates to show the selected venture's data
```

For invited users: their `workspace_id` in metadata already points to the owner's workspace — no change needed.

---

## What Does NOT Change
- All DB table schemas (no migration needed)
- All reducers
- All entity types (Project, Client, Payment etc.)
- The `businessId` field on entities — still used internally as the single business's ID in that workspace
- RLS policies — already use `workspace_id`
- Back Office team management, partner management, payables/receivables

---

## Summary of User-Facing Changes
1. "Business" everywhere becomes "Venture"
2. No multi-business switcher dropdown — replaced by workspace-level venture switcher
3. Back Office "Businesses" page → "Venture Settings" (edit the single venture)
4. "Business Access" → "Venture Access" with simplified permissions (no per-business checkbox since workspace = one venture)
5. Creating a new venture = creating a new workspace (separate data silo)
6. Existing multi-business users see a one-time migration prompt
