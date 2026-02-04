
## Rebuild Assignee Selector with Native Checkbox

### Problem
The Radix UI `Checkbox` component's internal ref management creates an infinite update loop when rendered inside clickable containers. The stack trace shows `setRef` calls cascading infinitely.

### Solution
Replace the Radix UI `Checkbox` with a native HTML `<input type="checkbox">` styled with Tailwind CSS. This completely bypasses Radix's ref management while maintaining the same visual appearance.

### File Changes

**File: `src/components/todos/AssigneeSelector.tsx`**

1. Remove the Radix Checkbox import
2. Create a styled native checkbox that matches the current design
3. Update the `renderCheckbox` function to use native HTML input

```text
Changes Overview:
- Line 3: Remove Checkbox import from '@/components/ui/checkbox'
- Lines 94-108: Replace renderCheckbox function with native checkbox implementation
```

**Updated renderCheckbox function:**
```tsx
const renderCheckbox = (option: PersonOption) => {
  const selected = isSelected(option);
  return (
    <div
      key={`${option.type}-${option.id}`}
      className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
      onClick={() => toggleAssignee(option)}
    >
      {/* Native checkbox styled to match Radix design */}
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center",
          selected && "bg-primary text-primary-foreground"
        )}
      >
        {selected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{option.name}</p>
        {option.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{option.subtitle}</p>
        )}
      </div>
    </div>
  );
};
```

### Why This Works
- Native HTML elements don't have Radix's ref management overhead
- No `onCheckedChange` handler that could conflict with parent `onClick`
- Single event handler on parent div controls all selection logic
- Visual appearance matches the original Radix Checkbox design

### Technical Details

| Aspect | Before (Radix) | After (Native) |
|--------|---------------|----------------|
| Ref Management | Complex internal state | None |
| Event Handling | Both `onClick` and `onCheckedChange` | Single parent `onClick` |
| Re-render Behavior | Triggers ref updates | Stable |
| Styling | Radix classes | Tailwind classes |

### Files Summary

| File | Change |
|------|--------|
| `src/components/todos/AssigneeSelector.tsx` | Replace Radix Checkbox with styled native checkbox |
