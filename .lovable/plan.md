

## Plan: To-Do List Section with Multi-Assignee Support

### Overview

This plan creates a new major section of the app - **To-Do List** - as a standalone productivity hub for managing daily and weekly tasks across all your businesses. Tasks can be assigned to three types of people: **Team Members**, **Partners**, and **Operators** (workspace owners/admins).

---

### Assignee Types Explained

| Type | Who They Are | Source |
|------|--------------|--------|
| **Self** | Current logged-in user | `userSettings.userId` |
| **Team Members** | Employees/contractors working on tasks | `teamMembers[]` |
| **Partners** | Business partners (sales/managing) | `partners[]` |
| **Operators** | Workspace owners/admins managing businesses | `userBusinessAccess[]` (owner/admin roles) |

---

### Part 1: Data Types

**File: `src/types/business.ts`**

Add new ToDo entity with multi-assignee support:

```typescript
// To-Do Priority Levels
export type ToDoPriority = 'low' | 'medium' | 'high' | 'urgent';

// What the to-do is linked to
export type ToDoLinkType = 
  | 'project' 
  | 'quick-task' 
  | 'retainer' 
  | 'client' 
  | 'product' 
  | 'sales-order'
  | 'expense'
  | 'renewal'
  | 'general';

// Who the task is assigned to
export type ToDoAssigneeType = 'self' | 'team-member' | 'partner' | 'operator';

// Main To-Do Entity
export interface ToDo {
  id: string;
  businessId?: string;         // Optional - can be cross-business or specific
  title: string;
  description?: string;
  
  // Timing
  dueDate: string;             // ISO date (the target date)
  originalDueDate?: string;    // Tracks if task was carried forward
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  
  // Status
  status: 'pending' | 'done' | 'cancelled';
  completedAt?: string;
  
  // Priority
  priority: ToDoPriority;
  
  // Assignment - supports multiple assignee types
  assigneeType: ToDoAssigneeType;
  assigneeId?: string;         // Team member ID, Partner ID, or Operator userId
  assigneeName?: string;       // Cached name for quick display
  createdBy: string;           // Who created this task (userId)
  
  // Links to other entities
  linkType: ToDoLinkType;
  linkedEntityId?: string;     // ID of the linked project/client/etc.
  linkedEntityName?: string;   // Cached name for quick display
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

Add to AppData:
```typescript
export interface AppData {
  // ... existing fields
  todos: ToDo[];
}
```

---

### Part 2: Reducer for To-Do CRUD

**File: `src/reducers/todoReducer.ts`** (NEW)

```typescript
import { AppData, ToDo } from '@/types/business';
import { BusinessAction } from './types';

export const todoReducer = (state: AppData, action: BusinessAction): AppData | null => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...(state.todos || []), action.payload],
      };

    case 'UPDATE_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload.id
            ? { ...todo, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : todo
        ),
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: (state.todos || []).filter(todo => todo.id !== action.payload),
      };

    case 'COMPLETE_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload
            ? { ...todo, status: 'done', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : todo
        ),
      };

    case 'CARRY_FORWARD_TODO':
      return {
        ...state,
        todos: (state.todos || []).map(todo =>
          todo.id === action.payload.id
            ? { 
                ...todo, 
                originalDueDate: todo.originalDueDate || todo.dueDate,
                dueDate: action.payload.newDueDate,
                updatedAt: new Date().toISOString() 
              }
            : todo
        ),
      };

    case 'BULK_CARRY_FORWARD_TODOS':
      const today = new Date().toISOString().split('T')[0];
      return {
        ...state,
        todos: (state.todos || []).map(todo => {
          if (action.payload.ids.includes(todo.id)) {
            return {
              ...todo,
              originalDueDate: todo.originalDueDate || todo.dueDate,
              dueDate: action.payload.newDueDate,
              updatedAt: new Date().toISOString(),
            };
          }
          return todo;
        }),
      };

    default:
      return null;
  }
};
```

---

### Part 3: Action Types

**File: `src/reducers/types.ts`**

Add ToDo actions:

```typescript
import { ToDo } from '@/types/business';

// Add to BusinessAction union:
// To-Do actions
| { type: 'ADD_TODO'; payload: ToDo }
| { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<ToDo> } }
| { type: 'DELETE_TODO'; payload: string }
| { type: 'COMPLETE_TODO'; payload: string }
| { type: 'CARRY_FORWARD_TODO'; payload: { id: string; newDueDate: string } }
| { type: 'BULK_CARRY_FORWARD_TODOS'; payload: { ids: string[]; newDueDate: string } }
```

---

### Part 4: To-Do Layout & Sidebar

**File: `src/layouts/TodoLayout.tsx`** (NEW)

Similar structure to BusinessManagementLayout - a standalone section with its own navigation.

**File: `src/components/TodoSidebar.tsx`** (NEW)

Navigation items with badge counts:
- Overview (summary dashboard)
- Today (daily focus) - badge: pending count
- This Week (weekly planning)
- Upcoming (future tasks)
- Overdue (urgent attention) - badge: overdue count (red)
- By Assignee (filter by person)
- All Tasks (complete list)
- Back to BizSuite link

---

### Part 5: Assignee Selector Component

**File: `src/components/todos/AssigneeSelector.tsx`** (NEW)

A reusable component for selecting assignees across all three types:

```typescript
interface AssigneeSelectorProps {
  assigneeType: ToDoAssigneeType;
  assigneeId?: string;
  businessId?: string;
  onSelect: (type: ToDoAssigneeType, id?: string, name?: string) => void;
}

// Groups assignees into sections:
// - Self (always first option)
// - Operators (from userBusinessAccess with owner/admin role)
// - Team Members (filtered by businessId if provided)
// - Partners (filtered by businessId if provided)
```

Visual structure:
```text
+----------------------------------+
| Assign To                        |
+----------------------------------+
| ◉ Self                           |
+----------------------------------+
| OPERATORS                        |
|   ○ John Owner (owner)           |
|   ○ Jane Admin (admin)           |
+----------------------------------+
| TEAM MEMBERS                     |
|   ○ Mike Developer               |
|   ○ Sarah Designer               |
+----------------------------------+
| PARTNERS                         |
|   ○ Alex Partner (sales)         |
|   ○ Chris Partner (managing)     |
+----------------------------------+
```

---

### Part 6: Entity Link Selector Component

**File: `src/components/todos/EntityLinkSelector.tsx`** (NEW)

A component for linking tasks to business entities:

```typescript
interface EntityLinkSelectorProps {
  linkType: ToDoLinkType;
  linkedEntityId?: string;
  businessId?: string;
  onSelect: (type: ToDoLinkType, id?: string, name?: string) => void;
}

// Shows different dropdowns based on business model:
// Service: Projects, Quick Tasks, Retainers, Clients, Expenses, Renewals
// Product: Products, Sales Orders, Customers, Expenses
// Hybrid: All of the above
```

---

### Part 7: To-Do Modal

**File: `src/components/TodoModal.tsx`** (NEW)

Form fields:
- Title (required)
- Description (optional)
- Due Date (date picker)
- Priority (Low/Medium/High/Urgent)
- Business (dropdown - optional, for cross-business view)
- Assign To (AssigneeSelector component)
  - Self
  - Select Operator
  - Select Team Member
  - Select Partner
- Link To (EntityLinkSelector component)
  - None (General task)
  - Project / Quick Task / Retainer / Client
  - Product / Sales Order / Customer
- Notes (optional textarea)

---

### Part 8: Core Pages

**File: `src/components/todos/TodoOverview.tsx`** (NEW)

Dashboard showing:
- Summary cards (Today's tasks, This week, Overdue, Completion rate)
- Quick-add task form
- Today's priority tasks
- Upcoming deadlines
- Task distribution by assignee (pie chart)

**File: `src/components/todos/TodayPage.tsx`** (NEW)

Daily focus view:
- Header with date
- Sections: Overdue (red), Due Today, Completed Today
- Checkbox to mark done
- "Carry to Tomorrow" action
- Assignee avatar/badge on each task

**File: `src/components/todos/WeekPage.tsx`** (NEW)

Weekly planning view:
- Week header with navigation
- Daily columns or list view
- Task counts per day
- Drag-and-drop (future enhancement)

**File: `src/components/todos/OverduePage.tsx`** (NEW)

Urgent attention view:
- All overdue tasks prominently displayed
- "Days overdue" indicator
- Bulk actions: Complete All, Reschedule All, Cancel All
- Filtered by assignee option

**File: `src/components/todos/ByAssigneePage.tsx`** (NEW)

View grouped by person:
- Tabs or dropdown: Self | Operators | Team Members | Partners
- Shows workload per person
- Task counts and completion rates

**File: `src/components/todos/AllTodosPage.tsx`** (NEW)

Complete list with filters:
- Search
- Filter by: Business, Status, Priority, Assignee Type, Assignee, Link Type
- Sort by: Due date, Priority, Created date, Assignee
- Bulk actions

---

### Part 9: Routing

**File: `src/App.tsx`**

Add new route group:

```typescript
import { TodoLayout } from "./layouts/TodoLayout";
import { TodoOverview } from "./components/todos/TodoOverview";
// ... other imports

<Route element={<TodoLayout />}>
  <Route path="/todos" element={<TodoOverview />} />
  <Route path="/todos/today" element={<TodayPage />} />
  <Route path="/todos/week" element={<WeekPage />} />
  <Route path="/todos/upcoming" element={<UpcomingPage />} />
  <Route path="/todos/overdue" element={<OverduePage />} />
  <Route path="/todos/by-assignee" element={<ByAssigneePage />} />
  <Route path="/todos/all" element={<AllTodosPage />} />
</Route>
```

---

### Part 10: Main App Integration

**File: `src/components/AppSidebar.tsx`**

Add To-Do quick access with overdue badge:

```typescript
// In navigation items:
{ 
  id: 'todos', 
  label: 'To-Do', 
  icon: ListTodo, 
  path: '/todos',
  badge: overdueCount // Shows red badge if overdue tasks exist
}
```

---

### Part 11: Initialize Data

**File: `src/repositories/LocalStorageRepository.ts`**

Add `todos: []` to initial data structure.

**File: `src/reducers/rootReducer.ts`**

Register todoReducer in domain reducers.

**File: `src/reducers/index.ts`**

Export todoReducer.

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/business.ts` | Modify | Add ToDo interface with multi-assignee types |
| `src/reducers/types.ts` | Modify | Add ToDo action types |
| `src/reducers/todoReducer.ts` | Create | CRUD operations for todos |
| `src/reducers/rootReducer.ts` | Modify | Register todoReducer |
| `src/reducers/index.ts` | Modify | Export todoReducer |
| `src/layouts/TodoLayout.tsx` | Create | Layout wrapper for todo pages |
| `src/components/TodoSidebar.tsx` | Create | Navigation for todo section |
| `src/components/todos/AssigneeSelector.tsx` | Create | Multi-type assignee picker |
| `src/components/todos/EntityLinkSelector.tsx` | Create | Entity link picker |
| `src/components/todos/TodoOverview.tsx` | Create | Overview dashboard |
| `src/components/todos/TodayPage.tsx` | Create | Daily task view |
| `src/components/todos/WeekPage.tsx` | Create | Weekly planning view |
| `src/components/todos/UpcomingPage.tsx` | Create | Future tasks view |
| `src/components/todos/OverduePage.tsx` | Create | Overdue tasks view |
| `src/components/todos/AllTodosPage.tsx` | Create | Complete task list |
| `src/components/todos/ByAssigneePage.tsx` | Create | View by assignee |
| `src/components/TodoModal.tsx` | Create | Add/Edit todo form |
| `src/App.tsx` | Modify | Add todo routes |
| `src/components/AppSidebar.tsx` | Modify | Add todo navigation |
| `src/repositories/LocalStorageRepository.ts` | Modify | Initialize todos array |

---

### Visual: Assignment Flow

```text
+----------------------------------------------------------+
| New Task                                      [Save]      |
+----------------------------------------------------------+
| Title: Review Q4 financial reports                        |
| Due: Feb 5, 2025          Priority: [High ▼]             |
+----------------------------------------------------------+
| Business: [All Businesses ▼] or [Specific Business ▼]    |
+----------------------------------------------------------+
| ASSIGN TO                                                 |
+----------------------------------------------------------+
| ◉ Self                                                    |
| ○ Operator: John Owner                                    |
| ○ Operator: Jane Admin                                    |
| ○ Team Member: Mike Developer                             |
| ○ Team Member: Sarah Designer                             |
| ○ Partner: Alex Sales Partner                             |
| ○ Partner: Chris Managing Partner                         |
+----------------------------------------------------------+
| LINK TO                                                   |
+----------------------------------------------------------+
| ○ None (General Task)                                     |
| ○ Project: Website Redesign                               |
| ○ Client: Acme Corp                                       |
| ○ Retainer: Monthly Support                               |
+----------------------------------------------------------+
```

---

### Visual: Today's Tasks with Assignees

```text
+----------------------------------------------------------------+
| Today - Tuesday, February 4, 2025                  [+ Add Task] |
| 5 tasks • 2 completed                                           |
+----------------------------------------------------------------+

+----------------------------------------------------------------+
| ⚠️ OVERDUE (1 task)                                             |
+----------------------------------------------------------------+
| [ ] Review project proposal                    🔴 HIGH          |
|     👤 John Owner (operator) • Project: Website Redesign       |
|     (1 day overdue)                          [↻ Move] [✓ Done] |
+----------------------------------------------------------------+

+----------------------------------------------------------------+
| DUE TODAY (2 tasks)                                             |
+----------------------------------------------------------------+
| [ ] Send invoice to client                    🟡 MEDIUM         |
|     👤 Self • Client: Acme Corp              [✓ Done]          |
|                                                                 |
| [ ] Review design mockups                     🟢 LOW            |
|     👤 Sarah Designer (team) • Project: App  [✓ Done]          |
+----------------------------------------------------------------+

+----------------------------------------------------------------+
| COMPLETED TODAY ✓                                               |
+----------------------------------------------------------------+
| [✓] Morning standup notes                     Jane Admin        |
| [✓] Update client on progress                 Self              |
+----------------------------------------------------------------+
```

---

### Visual: By Assignee View

```text
+----------------------------------------------------------------+
| Tasks by Assignee                              [+ Add Task]     |
+----------------------------------------------------------------+

+------------------+------------------+------------------+
| SELF             | OPERATORS        | TEAM MEMBERS     |
| 8 tasks          | 12 tasks         | 15 tasks         |
| 2 overdue        | 1 overdue        | 3 overdue        |
+------------------+------------------+------------------+

+----------------------------------------------------------------+
| [Self ▼] [Operators ▼] [Team Members ▼] [Partners ▼]           |
+----------------------------------------------------------------+

| Assignee          | Pending | Overdue | Done Today | Total     |
|-------------------|---------|---------|------------|-----------|
| Self              | 6       | 2       | 4          | 12        |
| John Owner        | 5       | 0       | 2          | 7         |
| Jane Admin        | 4       | 1       | 3          | 8         |
| Mike Developer    | 8       | 2       | 1          | 11        |
| Sarah Designer    | 4       | 1       | 2          | 7         |
| Alex Partner      | 3       | 0       | 0          | 3         |
+----------------------------------------------------------------+
```

---

### Key Behaviors

1. **Multi-Assignee Support**: Tasks can be assigned to Self, Team Members, Partners, or Operators - covering all stakeholders

2. **Operator Detection**: Operators are pulled from `userBusinessAccess` where role is 'owner' or 'admin'

3. **Business Filtering**: When a business is selected, Team Members and Partners are filtered by their `businessIds`

4. **Cross-Business Tasks**: Tasks without a `businessId` are visible across all businesses (for operators managing multiple businesses)

5. **Overdue Detection**: Tasks with `dueDate < today` and `status !== 'done'` are flagged

6. **Carry Forward**: Preserves `originalDueDate` to track how many times a task was postponed

7. **Entity Linking**: Tasks can link to Projects, Clients, Products, etc. based on business model

---

### Implementation Order

**Phase 1: Core Infrastructure**
1. Add ToDo types to business.ts
2. Add actions to types.ts
3. Create todoReducer.ts
4. Register reducer
5. Initialize todos in repository

**Phase 2: Layout & Navigation**
1. Create TodoLayout.tsx
2. Create TodoSidebar.tsx
3. Add routes to App.tsx
4. Add navigation link in AppSidebar

**Phase 3: Modal & Selectors**
1. Create AssigneeSelector component
2. Create EntityLinkSelector component
3. Create TodoModal

**Phase 4: Core Pages**
1. TodoOverview (dashboard)
2. TodayPage (daily focus)
3. OverduePage (urgent tasks)

**Phase 5: Additional Views**
1. WeekPage
2. UpcomingPage
3. AllTodosPage
4. ByAssigneePage

