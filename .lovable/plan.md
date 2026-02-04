

## Fix Assignee Selector Data Synchronization

### Current Issue
The AssigneeSelector component has the correct structure but the data retrieval logic has gaps:

1. **Operators**: The workspace owner (current user) isn't in `userBusinessAccess` by default - they're only added when they explicitly share access with others
2. **Team Members/Partners**: When `businessId` is undefined (e.g., cross-business todos), the filtering logic doesn't show all members

### Solution
Update the data retrieval logic in `AssigneeSelector.tsx` to:

1. **Always include the current user as an operator** (they're always at minimum an owner/admin of their workspace)
2. **Show all team members and partners when no business is selected** (remove the restrictive filtering)
3. **Include all users from `userBusinessAccess` with owner/admin roles**

### File Changes

**File: `src/components/todos/AssigneeSelector.tsx`**

1. Update operators logic to include current user
2. Fix team members/partners filtering to show all when no businessId

### Code Changes

```text
Lines 36-47: Update operators logic
```

**Current:**
```tsx
const operators = useMemo(() => {
  const accessList = data.userBusinessAccess || [];
  return accessList
    .filter(access => access.role === 'owner' || access.role === 'admin')
    .map(access => ({
      id: access.userId,
      name: access.email || `User ${access.userId.slice(0, 8)}`,
      type: 'operator' as ToDoAssigneeType,
      subtitle: access.role,
    }));
}, [data.userBusinessAccess]);
```

**Updated:**
```tsx
const operators = useMemo(() => {
  const accessList = data.userBusinessAccess || [];
  const operatorList: PersonOption[] = [];
  
  // Add current user as operator (always has access)
  const currentUserId = data.userSettings.userId;
  const currentUserInList = accessList.find(a => a.userId === currentUserId);
  
  if (!currentUserInList || currentUserInList.role === 'owner' || currentUserInList.role === 'admin') {
    operatorList.push({
      id: currentUserId || 'current-user',
      name: data.userSettings.username || 'Me',
      type: 'operator' as ToDoAssigneeType,
      subtitle: currentUserInList?.role || 'owner',
    });
  }
  
  // Add other operators from access list (exclude current user to avoid duplicates)
  accessList
    .filter(access => 
      (access.role === 'owner' || access.role === 'admin') && 
      access.userId !== currentUserId
    )
    .forEach(access => {
      operatorList.push({
        id: access.userId,
        name: access.email || `User ${access.userId.slice(0, 8)}`,
        type: 'operator' as ToDoAssigneeType,
        subtitle: access.role,
      });
    });
  
  return operatorList;
}, [data.userBusinessAccess, data.userSettings]);
```

```text
Lines 49-61: Update team members logic
```

**Current:**
```tsx
const teamMembers = useMemo(() => {
  let members = data.teamMembers || [];
  if (businessId) {
    members = members.filter(m => m.businessIds?.includes(businessId));
  }
  return members.map(m => ({...}));
}, [data.teamMembers, businessId]);
```

**Updated:**
```tsx
const teamMembers = useMemo(() => {
  let members = data.teamMembers || [];
  // Only filter by business if a specific business is selected
  // When businessId is undefined, show all team members
  if (businessId) {
    members = members.filter(m => m.businessIds?.includes(businessId));
  }
  return members.map(m => ({
    id: m.id,
    name: m.name,
    type: 'team-member' as ToDoAssigneeType,
    subtitle: m.role,
  }));
}, [data.teamMembers, businessId]);
```

```text
Lines 63-75: Update partners logic (same pattern)
```

**Updated:**
```tsx
const partners = useMemo(() => {
  let partnerList = data.partners || [];
  // Only filter by business if a specific business is selected
  if (businessId) {
    partnerList = partnerList.filter(p => p.businessIds?.includes(businessId));
  }
  return partnerList.map(p => ({
    id: p.id,
    name: p.name,
    type: 'partner' as ToDoAssigneeType,
    subtitle: p.type,
  }));
}, [data.partners, businessId]);
```

### Data Sources Summary

| Category | Source Location | Filter Condition |
|----------|-----------------|------------------|
| **Self** | `userSettings.username/userId` | Always shown |
| **Operators** | Current user + `userBusinessAccess` (role = owner/admin) | Always shown |
| **Team Members** | `data.teamMembers` (Admin Console) | By `businessId` if provided |
| **Partners** | `data.partners` (Admin Console) | By `businessId` if provided |

### Expected Outcome
After this fix:
- Current user always appears under "Operators"
- All team members from Admin Console appear
- All partners from Admin Console appear
- When a specific business is selected, team members and partners filter accordingly

