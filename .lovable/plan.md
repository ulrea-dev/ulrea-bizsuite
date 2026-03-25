
## Migration: localStorage JSON blob → Supabase Database Tables

### The Problem
The app stores everything as one giant JSON blob in localStorage and syncs it to Supabase Storage as a file. This causes:
- No real access control (you can't enforce per-row permissions on a JSON file)
- Invited users see all data or nothing — no granular filtering
- No multi-device real-time sync
- Race conditions when multiple users write simultaneously
- localStorage size limits (~5MB) will eventually break

### The Solution: Proper Supabase Tables with RLS

Each entity type gets its own table. RLS policies enforce per-workspace access. The React app switches from a localStorage-backed reducer to direct Supabase reads/writes. localStorage can remain as a fast in-memory cache but Supabase becomes the source of truth.

---

## Database Schema — Tables to Create

All tables follow this pattern:
- `id uuid` (primary key)
- `workspace_id text` (the account name slug — ties all data to one workspace/owner)
- `created_at / updated_at timestamps`
- RLS: users can only access rows where `workspace_id` matches their stored workspace in auth metadata

**Core tables** (22 total):

```text
workspaces          — workspace settings, owner_user_id, account_name
businesses          — workspace_id FK, business data
projects            — workspace_id FK, business_id
clients             — workspace_id FK
team_members        — workspace_id FK
partners            — workspace_id FK
payments            — workspace_id FK
expenses            — workspace_id FK
bank_accounts       — workspace_id FK
salary_records      — workspace_id FK
salary_payments     — workspace_id FK
payroll_periods     — workspace_id FK
payslips            — workspace_id FK
extra_payments      — workspace_id FK
quick_tasks         — workspace_id FK
retainers           — workspace_id FK
renewals            — workspace_id FK
renewal_payments    — workspace_id FK
payables            — workspace_id FK
receivables         — workspace_id FK
todos               — workspace_id FK
service_types       — workspace_id FK
products            — workspace_id FK
customers           — workspace_id FK
sales_orders        — workspace_id FK
workspace_users     — workspace_id, user_id, role, business_ids[] — access control table
user_settings       — user_id (Supabase auth UUID), preferences
exchange_rates      — workspace_id FK
custom_currencies   — workspace_id FK
```

Complex nested objects (e.g., `project.allocations`, `project.teamAllocations`, `salesOrder.items`, `payslip.deductions`) will be stored as JSONB columns since they are tightly coupled to their parent record and not queried independently.

---

## RLS Strategy

Instead of a rigid `workspace_id = auth.uid()` pattern, we use a helper function:

```sql
CREATE OR REPLACE FUNCTION public.get_user_workspace_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'workspace_id')
  -- Owners: their own workspace slug  
  -- Invited users: the owner's workspace slug (set in metadata on invite)
$$;
```

All tables get: `USING (workspace_id = public.get_user_workspace_id())`

Workspace owners have `workspace_id` set to their own slug. Invited users have `workspace_id` pointing to the owner's slug (already set via the `manage-workspace-users` edge function). This means the same policy works for both owners and guests seamlessly.

For `workspace_users` table specifically:
- Owners can manage all rows in their workspace
- Members can only read their own row

---

## Migration Strategy (No Data Loss)

The existing JSON data in Supabase Storage (e.g., `my-workspace/data.json`) will be migrated automatically:

1. New `SupabaseDBRepository` class implementing `IDataRepository` — reads/writes from DB tables
2. On first load after migration, if DB tables are empty but Storage file exists → import JSON to DB automatically (one-time migration)
3. `BusinessContext` keeps its `useReducer` pattern — the reducer runs on client, then dispatches a background DB sync
4. All existing dispatched actions still work — only the persistence layer changes

---

## Data Flow After Migration

```text
User action (e.g., ADD_PROJECT)
  → rootReducer (in-memory state update, instant UI)
  → BusinessContext useEffect → calls SupabaseDBRepository.save(entity)
  → INSERT/UPDATE to Supabase table
  → RLS enforces workspace access

On app load:
  → SupabaseDBRepository.load() → SELECT from all tables WHERE workspace_id = get_user_workspace_id()
  → Returns AppData (same shape as before)
  → BusinessContext initializes useReducer with this data
```

This keeps all existing UI code, reducers, and components untouched — only the repository layer changes.

---

## Files to Create/Change

### New: Database Migrations
1. `supabase/migrations/YYYYMMDD_create_workspace_tables.sql` — All 28 tables + RLS policies + helper function

### New: `src/repositories/SupabaseDBRepository.ts`
- Implements `IDataRepository`
- `load()`: queries all tables, assembles AppData
- `save(data)`: broken into `saveEntity(table, record)` — called per-record from context
- Also exposes `syncEntity(type, id, data)` for incremental saves

### Modified: `src/contexts/BusinessContext.tsx`
- Switch from batch `repository.save(data)` on every state change to targeted `repository.syncEntity(...)` calls
- Each action type maps to a specific table + operation (INSERT/UPDATE/DELETE)
- Keep localStorage as a fast offline cache (write-through)

### Modified: `src/repositories/RepositoryProvider.tsx`
- Default repository becomes `SupabaseDBRepository`
- On init: if tables are empty and Storage backup exists → run one-time migration

### Modified: `src/layouts/HubLayout.tsx`
- Remove the complex "download cloud and dispatch LOAD_DATA" invited-user logic
- RLS handles it: invited users automatically only see their workspace's data from the DB

### Modified: `src/utils/filterDataForUser.ts`
- `getUserAccessibleBusinessIds` becomes simpler — the DB already returns only accessible data
- Keep for local in-memory filtering of the already-loaded state

---

## Phased Rollout (to avoid breaking the app)

**Phase 1** (this implementation):
- Create all DB tables + RLS
- Create `SupabaseDBRepository` 
- Swap the default repository
- One-time migration from Storage JSON on first authenticated load
- Keep localStorage as read-through cache

**Phase 2** (future):
- Real-time subscriptions via `supabase.channel()` for multi-user live updates
- Pagination for large datasets (projects, payments etc.)

---

## Summary of Steps

| Step | What | Files |
|------|------|-------|
| 1 | DB migration: all tables + RLS | `supabase/migrations/...` |
| 2 | `SupabaseDBRepository` load/save | `src/repositories/SupabaseDBRepository.ts` |
| 3 | Update RepositoryProvider to use DB repo | `src/repositories/RepositoryProvider.tsx` |
| 4 | Update BusinessContext to sync per-action | `src/contexts/BusinessContext.tsx` |
| 5 | One-time migration from Storage JSON | Inside `SupabaseDBRepository.load()` |
| 6 | Simplify HubLayout invited-user logic | `src/layouts/HubLayout.tsx` |

The entire existing component tree, reducers, and UI remain **unchanged**. Only the persistence layer is swapped.
