

## Plan: To-Do System Enhancements

This plan implements three features to enhance the To-Do system: dashboard notifications, recurring tasks, and drag-and-drop rescheduling.

---

### Feature 1: Dashboard Notifications for Tasks

Add a notification banner on the main dashboard showing overdue and upcoming tasks, following the existing renewal reminders pattern.

**File: `src/hooks/useTodoReminders.ts`** (NEW)

Create a hook similar to `useRenewalReminders.ts`:

```typescript
export const useTodoReminders = () => {
  const { data } = useBusiness();
  const [dismissed, setDismissed] = useState(false);

  const stats = useMemo(() => {
    const todos = data.todos || [];
    const today = new Date().toISOString().split('T')[0];
    const pending = todos.filter(t => t.status === 'pending');
    
    const overdue = pending.filter(t => t.dueDate < today);
    const dueToday = pending.filter(t => t.dueDate === today);
    const dueTomorrow = pending.filter(t => /* tomorrow check */);
    
    return { overdue, dueToday, dueTomorrow, totalUrgent: overdue.length + dueToday.length };
  }, [data.todos]);

  return {
    ...stats,
    shouldShowReminder: stats.totalUrgent > 0 && !dismissed,
    dismissReminder: () => setDismissed(true),
  };
};
```

**File: `src/components/DashboardHome.tsx`** (MODIFY)

Add a task reminder banner below the renewal reminder:

- Red alert for overdue tasks
- Yellow/orange for tasks due today
- Show count and "View To-Do" button
- Dismissible like renewal banner

---

### Feature 2: Recurring Tasks Functionality

Implement the recurring task logic using the existing `isRecurring` and `recurringPattern` fields.

**File: `src/types/business.ts`** (MODIFY)

Add additional recurring task fields:

```typescript
export interface ToDo {
  // ... existing fields
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringEndDate?: string;          // When to stop recurring
  parentRecurringId?: string;         // Link to original recurring task
  lastGeneratedDate?: string;         // Track last auto-generation
}
```

**File: `src/reducers/types.ts`** (MODIFY)

Add new action for completing recurring tasks:

```typescript
| { type: 'COMPLETE_RECURRING_TODO'; payload: string }
```

**File: `src/reducers/todoReducer.ts`** (MODIFY)

Add `COMPLETE_RECURRING_TODO` action that:
1. Marks current task as done
2. Creates next occurrence based on pattern
3. Links new task to parent via `parentRecurringId`

```typescript
case 'COMPLETE_RECURRING_TODO':
  const todo = state.todos.find(t => t.id === action.payload);
  if (!todo || !todo.isRecurring) return state;
  
  const nextDueDate = calculateNextDate(todo.dueDate, todo.recurringPattern);
  
  // Check if within end date
  if (todo.recurringEndDate && nextDueDate > todo.recurringEndDate) {
    // Just complete, don't create new
    return { ...state, todos: state.todos.map(t => t.id === todo.id ? { ...t, status: 'done', completedAt: now } : t) };
  }
  
  const newTodo = {
    ...todo,
    id: generateId(),
    dueDate: nextDueDate,
    status: 'pending',
    parentRecurringId: todo.parentRecurringId || todo.id,
    createdAt: now,
  };
  
  return {
    ...state,
    todos: state.todos.map(t => t.id === todo.id ? { ...t, status: 'done', completedAt: now } : t).concat(newTodo),
  };
```

**File: `src/components/TodoModal.tsx`** (MODIFY)

Add recurring task options in the form:
- Toggle: "Recurring task"
- Frequency dropdown: Daily / Weekly / Monthly
- Optional end date picker

**File: `src/components/todos/TodoItem.tsx`** (MODIFY)

- Show recurring indicator icon (Repeat icon) on recurring tasks
- Change complete handler to dispatch `COMPLETE_RECURRING_TODO` for recurring tasks

---

### Feature 3: Drag-and-Drop in Week View

Add drag-and-drop functionality to reschedule tasks between days.

**Package Installation:**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**File: `src/components/todos/DraggableTodoItem.tsx`** (NEW)

Create a draggable wrapper for TodoItem:

```typescript
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export const DraggableTodoItem: React.FC<{ todo: ToDo }> = ({ todo }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
    data: { todo },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TodoItem todo={todo} compact />
    </div>
  );
};
```

**File: `src/components/todos/DroppableDay.tsx`** (NEW)

Create a droppable container for each day:

```typescript
import { useDroppable } from '@dnd-kit/core';

export const DroppableDay: React.FC<{ 
  date: string; 
  children: React.ReactNode;
  isToday: boolean;
  isPast: boolean;
}> = ({ date, children, isToday, isPast }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: date,
    data: { date },
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "rounded-lg border p-4 min-h-[100px] transition-colors",
        isToday && "border-primary bg-primary/5",
        isPast && "opacity-60",
        isOver && "border-primary border-dashed bg-primary/10"
      )}
    >
      {children}
    </div>
  );
};
```

**File: `src/components/todos/WeekPage.tsx`** (MODIFY)

Wrap content with DndContext and handle drag-end events:

```typescript
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';

export const WeekPage: React.FC = () => {
  const { dispatch } = useBusiness();
  const [activeTask, setActiveTask] = useState<ToDo | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const todoId = active.id as string;
    const newDate = over.id as string;
    
    dispatch({
      type: 'CARRY_FORWARD_TODO',
      payload: { id: todoId, newDueDate: newDate },
    });
    
    setActiveTask(null);
  };

  return (
    <DndContext 
      onDragStart={({ active }) => setActiveTask(active.data.current?.todo)}
      onDragEnd={handleDragEnd}
    >
      {/* Week view with DroppableDay and DraggableTodoItem */}
      
      <DragOverlay>
        {activeTask && <TodoItem todo={activeTask} compact />}
      </DragOverlay>
    </DndContext>
  );
};
```

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTodoReminders.ts` | Create | Hook for task notification stats |
| `src/components/DashboardHome.tsx` | Modify | Add task notification banner |
| `src/types/business.ts` | Modify | Add recurring task fields |
| `src/reducers/types.ts` | Modify | Add COMPLETE_RECURRING_TODO action |
| `src/reducers/todoReducer.ts` | Modify | Implement recurring task completion logic |
| `src/components/TodoModal.tsx` | Modify | Add recurring task form fields |
| `src/components/todos/TodoItem.tsx` | Modify | Show recurring icon, handle recurring completion |
| `src/components/todos/DraggableTodoItem.tsx` | Create | Draggable task wrapper |
| `src/components/todos/DroppableDay.tsx` | Create | Droppable day container |
| `src/components/todos/WeekPage.tsx` | Modify | Add DndContext and drag handlers |
| `package.json` | Modify | Add @dnd-kit dependencies |

---

### Visual: Dashboard with Task Notifications

```text
+------------------------------------------------------------------+
| Dashboard                                                         |
| Welcome to Acme Corp                                             |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| ⚠️ 3 renewals due soon                           [View Renewals] |
| 1 overdue, 2 due within 7 days                             [X]   |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| 📋 5 tasks need attention                           [View To-Do] |
| 2 overdue, 3 due today                                     [X]   |
+------------------------------------------------------------------+

| Active Works | Team Members | Retainer MRR | Team Budget |
```

---

### Visual: Recurring Task in Modal

```text
+----------------------------------------------------------+
| New Task                                      [Save]      |
+----------------------------------------------------------+
| Title: Weekly team standup                                |
+----------------------------------------------------------+
| Due: Feb 10, 2025          Priority: [Medium ▼]          |
+----------------------------------------------------------+
| ☑ Recurring Task                                          |
+----------------------------------------------------------+
| Frequency: [Weekly ▼]                                     |
| End Date:  [Optional] [Pick date...]                      |
+----------------------------------------------------------+
```

---

### Visual: Week View with Drag-and-Drop

```text
+------------------------------------------------------------------+
| This Week - Feb 3-9, 2025                          [+ Add Task]  |
+------------------------------------------------------------------+

+----------------+  +----------------+  +----------------+
| Mon 3          |  | Tue 4 (Today)  |  | Wed 5          |
| 2 tasks        |  | 3 tasks        |  | 1 task         |
|----------------|  |----------------|  |----------------|
| ≡ Review docs  |  | ≡ Team call    |  | ≡ Submit report|
| ≡ Email client |  | ≡ Design review|  |                |
|                |  | ≡ Budget update|  |                |
+----------------+  +----------------+  +----------------+

                    ↓ Drag task here ↓
                    (highlighted when dragging)

+----------------+  +----------------+  +----------------+
| Thu 6          |  | Fri 7          |  | Sat 8          |
| 0 tasks        |  | 2 tasks        |  | 0 tasks        |
|----------------|  |----------------|  |----------------|
| No tasks       |  | ≡ Weekly report|  | No tasks       |
|                |  | 🔄 Team standup|  |                |
+----------------+  +----------------+  +----------------+

🔄 = Recurring task indicator
≡ = Drag handle
```

---

### Implementation Order

**Phase 1: Dashboard Notifications**
1. Create `useTodoReminders.ts` hook
2. Add notification banner to `DashboardHome.tsx`

**Phase 2: Recurring Tasks**
1. Update `business.ts` with additional recurring fields
2. Add `COMPLETE_RECURRING_TODO` action
3. Implement reducer logic
4. Update `TodoModal.tsx` with recurring options
5. Update `TodoItem.tsx` to show indicator and handle completion

**Phase 3: Drag-and-Drop**
1. Install @dnd-kit packages
2. Create `DraggableTodoItem.tsx`
3. Create `DroppableDay.tsx`
4. Update `WeekPage.tsx` with DndContext

---

### Technical Notes

1. **Recurring Task ID Chain**: Use `parentRecurringId` to link all instances back to the original task for analytics/history

2. **DndContext Sensors**: Consider adding keyboard sensors for accessibility

3. **Performance**: DragOverlay renders the dragged item outside the normal flow, preventing layout shifts

4. **Touch Support**: @dnd-kit has built-in touch support for mobile drag-and-drop

