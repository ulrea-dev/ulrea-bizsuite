

## Plan: Move Team Member Management to Admin Console

### Overview

This plan will move Team Member management from the main app sidebar to the Admin Console, centralizing all team member CRUD operations with business filtering capabilities. The Admin Console will become the single place for managing team members across all businesses.

---

### Part 1: Create Admin Team Members Page

**File: `src/components/admin/TeamMembersPage.tsx`** (NEW)

Create a comprehensive team members management page following the same pattern as `PartnersPage.tsx`:

**Features:**
- Header with "Add Team Member" button
- Summary cards showing:
  - Total Team Members (filtered count)
  - Total Allocated (sum of allocations)
  - Total Paid
  - Outstanding payments
- Filter controls:
  - Search by name/email/role
  - Filter by business
  - Filter by member type (employee/contractor)
- Table view (desktop) / Card view (mobile)
- Actions: View, Edit, Delete, Payment History

**Key differences from main app TeamPage:**
- Shows ALL team members across ALL businesses (not filtered by current business)
- Business filter dropdown to narrow results
- No "Bulk Pay" button (payment features remain in main app)
- Delete functionality with confirmation dialog
- Cleaner admin-focused UI

---

### Part 2: Update Admin Sidebar Navigation

**File: `src/components/AdminSidebar.tsx`**

Add "Team Members" navigation item to the Admin Console sidebar:

```typescript
const navigationItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/business-management' },
  { id: 'businesses', label: 'Businesses', icon: Building2, path: '/business-management/businesses' },
  { id: 'business-access', label: 'Business Access', icon: Users, path: '/business-management/business-access' },
  { id: 'team-members', label: 'Team Members', icon: Users, path: '/business-management/team-members' },  // NEW
  { id: 'bank-accounts', label: 'Bank Accounts', icon: Wallet, path: '/business-management/bank-accounts' },
  // ... rest unchanged
];
```

Note: Will use a different icon (UserCog or UsersRound) to differentiate from "Business Access"

---

### Part 3: Add Route in App.tsx

**File: `src/App.tsx`**

Add the route for the new admin team members page:

```typescript
import { TeamMembersPage } from "./components/admin/TeamMembersPage";

// In BusinessManagementLayout routes:
<Route path="/business-management/team-members" element={<TeamMembersPage />} />
```

---

### Part 4: Remove Team from Main App Sidebar

**File: `src/components/AppSidebar.tsx`**

Remove the "Team" navigation item from the main sidebar since team management will now be centralized in Admin Console.

Currently in `commonItems`:
```typescript
{ id: 'team', label: 'Team', icon: Users, path: '/team' },
```

This will be removed from the navigation, but the route `/team` can remain for backward compatibility or be redirected.

---

### Part 5: Optional - Redirect /team Route

**File: `src/App.tsx`**

Add a redirect from `/team` to `/business-management/team-members`:

```typescript
<Route path="/team" element={<Navigate to="/business-management/team-members" replace />} />
```

This ensures any bookmarks or direct links continue to work.

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/TeamMembersPage.tsx` | Create | Full team member management page for Admin Console |
| `src/components/AdminSidebar.tsx` | Modify | Add Team Members nav item |
| `src/App.tsx` | Modify | Add route + redirect |
| `src/components/AppSidebar.tsx` | Modify | Remove Team from navigation |

---

### UI Structure: Admin Team Members Page

```text
+----------------------------------------------------------+
| Team Members Management                    [Add Member]   |
| Manage all team members across businesses                |
+----------------------------------------------------------+

+------------+ +------------+ +------------+ +------------+
| Total      | | Allocated  | | Paid       | | Outstanding|
| Members    | |            | |            | |            |
|   12       | |  $45,000   | |  $32,000   | |  $13,000   |
+------------+ +------------+ +------------+ +------------+

+----------------------------------------------------------+
| [Search...            ] [Business v] [Type v]            |
+----------------------------------------------------------+

+----------------------------------------------------------+
| Table/Cards                                              |
+----------------------------------------------------------+
| Name     | Type   | Role    | Businesses | Allocated | Actions |
|----------|--------|---------|------------|-----------|---------|
| John Doe | Emp.   | Dev     | Biz A, B   | $5,000    | V E D   |
| Jane...  | Contr. | Design  | Biz A      | $3,500    | V E D   |
+----------------------------------------------------------+
```

---

### Technical Notes

1. **Reuse TeamMemberModal**: The existing `TeamMemberModal` component already supports business assignment via checkboxes, making it perfect for the admin context

2. **Business filtering**: Filter by `member.businessIds` array - show members where the selected business ID is included in their businessIds

3. **Allocation calculations**: Similar logic to current TeamPage but without filtering by `currentBusiness` - aggregate across all businesses or filtered business

4. **Delete confirmation**: Add AlertDialog for delete operations (matching Partners page pattern)

5. **Payment History**: Keep the TeamMemberPaymentHistoryModal accessible from the admin page

---

### Navigation Flow Change

**Before:**
- Main App Sidebar -> Team -> Manage team members (filtered by current business)

**After:**
- Admin Console Sidebar -> Team Members -> Manage ALL team members (with business filter)
- Main app no longer has Team in sidebar

This aligns with the existing pattern where Partners are managed in Admin Console, not the main app.

