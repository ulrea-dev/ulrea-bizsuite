

## Plan: Multi-Assignee Support for To-Do Tasks

### Overview

This plan modifies the To-Do system to allow assigning tasks to multiple people across Operators, Team Members, and Partners. Currently, tasks can only have a single assignee - this change will allow multiple assignees per task.

---

### Current vs New Data Model

**Current (Single Assignee):**
```typescript
interface ToDo {
  assigneeType: ToDoAssigneeType;  // 'self' | 'team-member' | 'partner' | 'operator'
  assigneeId?: string;
  assigneeName?: string;
}
```

**New (Multiple Assignees):**
```typescript
interface ToDoAssignee {
  type: ToDoAssigneeType;
  id: string;
  name: string;
}

interface ToDo {
  assignees: ToDoAssignee[];  // Array of assignees
  // Keep legacy fields for backward compatibility during migration
  assigneeType?: ToDoAssigneeType;
  assigneeId?: string;
  assigneeName?: string;
}
```

---

### Part 1: Data Type Updates

**File: `src/types/business.ts`**

Add new interface and update ToDo:

```typescript
// New interface for individual assignee
export interface ToDoAssignee {
  type: ToDoAssigneeType;
  id: string;
  name: string;
}

export interface ToDo {
  // ... existing fields
  
  // NEW: Multiple assignees support
  assignees: ToDoAssignee[];
  
  // DEPRECATED: Keep for backward compatibility
  assigneeType?: ToDoAssigneeType;
  assigneeId?: string;
  assigneeName?: string;
}
```

---

### Part 2: Multi-Select Assignee Component

**File: `src/components/todos/AssigneeSelector.tsx`** (MODIFY)

Transform from radio/single-select to checkbox/multi-select:

- Replace RadioGroup with Checkbox list
- Group by category: Self, Operators, Team Members, Partners
- Show selected count badge
- Display selected assignees as chips/badges
- Allow removing individual assignees

Visual structure:
```text
+------------------------------------------+
| Assignees (3 selected)                    |
+------------------------------------------+
| ☑ Self                                    |
+------------------------------------------+
| OPERATORS                                 |
|   ☐ John Owner (owner)                    |
|   ☑ Jane Admin (admin)                    |
+------------------------------------------+
| TEAM MEMBERS                              |
|   ☑ Mike Developer                        |
|   ☐ Sarah Designer                        |
+------------------------------------------+
| PARTNERS                                  |
|   ☐ Alex Sales Partner                    |
|   ☐ Chris Managing Partner                |
+------------------------------------------+
| Selected:                                 |
| [Self ×] [Jane Admin ×] [Mike ×]         |
+------------------------------------------+
```

---

### Part 3: Update Todo Modal

**File: `src/components/TodoModal.tsx`** (MODIFY)

- Change state from single assignee to array:
  ```typescript
  const [assignees, setAssignees] = useState<ToDoAssignee[]>([]);
  ```
- Update AssigneeSelector props and callbacks
- Save `assignees` array to todo data
- Initialize from existing todo's assignees array

---

### Part 4: Update Todo Item Display

**File: `src/components/todos/TodoItem.tsx`** (MODIFY)

Display multiple assignees:
- Show avatar stack or comma-separated names
- Tooltip showing full list if many assignees
- Handle both old `assigneeName` and new `assignees` array for backward compatibility

```text
Before: 👤 John Owner (operator)
After:  👤 Self, Jane Admin, Mike  (+2 more)
```

---

### Part 5: Update Filtering Logic

**File: `src/components/todos/ByAssigneePage.tsx`** (MODIFY)

- Update filter logic to check if assignee exists in `assignees` array
- Count tasks per assignee correctly when task has multiple assignees

**File: `src/components/todos/AllTodosPage.tsx`** (MODIFY)

- Add assignee filter dropdown
- Search should check all assignee names

---

### Part 6: Backward Compatibility Migration

**File: `src/utils/todoMigration.ts`** (NEW)

Create a migration utility that converts old single-assignee format to new array format:

```typescript
export const migrateTodoAssignees = (todo: ToDo): ToDo => {
  // If already has assignees array, return as-is
  if (todo.assignees && todo.assignees.length > 0) {
    return todo;
  }
  
  // Migrate from legacy single assignee
  if (todo.assigneeType && todo.assigneeId) {
    return {
      ...todo,
      assignees: [{
        type: todo.assigneeType,
        id: todo.assigneeId,
        name: todo.assigneeName || 'Unknown',
      }],
    };
  }
  
  // Default to self
  return {
    ...todo,
    assignees: [],
  };
};
```

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/business.ts` | Modify | Add ToDoAssignee interface, update ToDo |
| `src/components/todos/AssigneeSelector.tsx` | Modify | Convert to multi-select checkbox UI |
| `src/components/TodoModal.tsx` | Modify | Handle assignees array state |
| `src/components/todos/TodoItem.tsx` | Modify | Display multiple assignees |
| `src/components/todos/ByAssigneePage.tsx` | Modify | Update filter logic for arrays |
| `src/components/todos/AllTodosPage.tsx` | Modify | Add assignee filter (already has status filter) |
| `src/utils/todoMigration.ts` | Create | Migration utility for backward compatibility |

---

### Visual: Multi-Assignee in Todo Modal

```text
+----------------------------------------------------------+
| New Task                                      [Save]      |
+----------------------------------------------------------+
| Title: Review Q4 financial reports                        |
| Due: Feb 5, 2025          Priority: [High ▼]             |
+----------------------------------------------------------+
| ASSIGNEES                                                 |
+----------------------------------------------------------+
| ☑ Self                                                    |
|                                                          |
| OPERATORS                                                 |
| ☐ John Owner (owner)                                      |
| ☑ Jane Admin (admin)                                      |
|                                                          |
| TEAM MEMBERS                                              |
| ☑ Mike Developer                                          |
| ☐ Sarah Designer                                          |
|                                                          |
| PARTNERS                                                  |
| ☐ Alex Sales Partner                                      |
|                                                          |
| Selected: [Self ×] [Jane Admin ×] [Mike Developer ×]     |
+----------------------------------------------------------+
```

---

### Visual: Multi-Assignee Display in Task Item

```text
+----------------------------------------------------------------+
| [ ] Review Q4 financial reports              🟠 HIGH            |
|     👤 Self, Jane Admin, Mike Developer                        |
|     🔗 Project: Website Redesign                               |
|     📅 Feb 5, 2025                                             |
+----------------------------------------------------------------+

With overflow (more than 3 assignees):
+----------------------------------------------------------------+
| [ ] Large team task                          🟡 MEDIUM          |
|     👤 Self, Jane Admin, Mike... (+2 more)                     |
|     📅 Feb 6, 2025                                             |
+----------------------------------------------------------------+
```

---

### Note on Status Filter

The status filter (pending/done/cancelled) already exists in `AllTodosPage.tsx` at lines 89-98. It's fully functional with the current implementation. No changes needed for status filtering.

---

### Implementation Order

**Phase 1: Data Model**
1. Add `ToDoAssignee` interface to `business.ts`
2. Update `ToDo` interface with `assignees` array
3. Create migration utility

**Phase 2: Selector Component**
1. Rewrite `AssigneeSelector.tsx` for multi-select

**Phase 3: Modal & Display**
1. Update `TodoModal.tsx` state management
2. Update `TodoItem.tsx` display logic

**Phase 4: Filtering**
1. Update `ByAssigneePage.tsx` filter logic
2. Add assignee filter to `AllTodosPage.tsx` if needed

