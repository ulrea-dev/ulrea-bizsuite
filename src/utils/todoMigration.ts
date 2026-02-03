import { ToDo, ToDoAssignee } from '@/types/business';

/**
 * Migrates a todo from legacy single-assignee format to new multi-assignee format.
 * Returns the todo unchanged if it already has assignees array.
 */
export const migrateTodoAssignees = (todo: ToDo): ToDo => {
  // If already has assignees array with content, return as-is
  if (todo.assignees && todo.assignees.length > 0) {
    return todo;
  }

  // Migrate from legacy single assignee fields
  if (todo.assigneeType && (todo.assigneeId || todo.assigneeType === 'self')) {
    const assignee: ToDoAssignee = {
      type: todo.assigneeType,
      id: todo.assigneeId || 'self',
      name: todo.assigneeName || (todo.assigneeType === 'self' ? 'Self' : 'Unknown'),
    };

    return {
      ...todo,
      assignees: [assignee],
    };
  }

  // Default to empty assignees array
  return {
    ...todo,
    assignees: [],
  };
};

/**
 * Migrate all todos in an array
 */
export const migrateAllTodos = (todos: ToDo[]): ToDo[] => {
  return todos.map(migrateTodoAssignees);
};

/**
 * Get display names for assignees (for showing in UI)
 */
export const getAssigneeDisplayNames = (assignees: ToDoAssignee[], maxShow: number = 3): string => {
  if (!assignees || assignees.length === 0) {
    return 'Unassigned';
  }

  const names = assignees.map(a => a.name);
  
  if (names.length <= maxShow) {
    return names.join(', ');
  }

  const shown = names.slice(0, maxShow).join(', ');
  const remaining = names.length - maxShow;
  return `${shown} (+${remaining} more)`;
};
