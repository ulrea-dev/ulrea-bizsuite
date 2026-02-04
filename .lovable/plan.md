

## Fix: Infinite Update Loop in Assignee Selection

### Problem Identified

The `AssigneeSelector` component has a **double event binding issue** causing the "Maximum update depth exceeded" error:

1. The parent `<div>` has `onClick={() => toggleAssignee(option)}`
2. The `<Checkbox>` has `onCheckedChange={() => toggleAssignee(option)}`
3. When clicking on the checkbox, `e.stopPropagation()` stops the browser click event but Radix's `onCheckedChange` still fires
4. In some edge cases, both handlers execute, causing rapid state updates that trigger React's infinite loop protection

### Solution

Simplify the event handling by:
1. **Remove the `onCheckedChange` handler from Checkbox** - let only the parent div handle clicks
2. **OR** Remove the parent div's `onClick` and let only the Checkbox handle changes

The cleanest approach is to keep the div's `onClick` for clickable area (entire row) and remove redundant `onCheckedChange` on Checkbox.

### File Changes

**File: `src/components/todos/AssigneeSelector.tsx`**

Update the `renderCheckbox` function to remove the `onCheckedChange` handler:

```tsx
const renderCheckbox = (option: PersonOption) => (
  <div
    key={`${option.type}-${option.id}`}
    className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
    onClick={() => toggleAssignee(option)}
  >
    <Checkbox
      checked={isSelected(option)}
      // Remove onCheckedChange - parent div handles the click
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{option.name}</p>
      {option.subtitle && (
        <p className="text-xs text-muted-foreground truncate">{option.subtitle}</p>
      )}
    </div>
  </div>
);
```

### Technical Details

The fix changes lines 94-112 in `AssigneeSelector.tsx`:

**Before (problematic):**
```tsx
const renderCheckbox = (option: PersonOption) => (
  <div
    key={`${option.type}-${option.id}`}
    className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
    onClick={() => toggleAssignee(option)}
  >
    <Checkbox
      checked={isSelected(option)}
      onCheckedChange={() => toggleAssignee(option)}  // ❌ Double trigger
      onClick={(e) => e.stopPropagation()}            // ❌ Doesn't prevent onCheckedChange
    />
```

**After (fixed):**
```tsx
const renderCheckbox = (option: PersonOption) => (
  <div
    key={`${option.type}-${option.id}`}
    className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 cursor-pointer"
    onClick={() => toggleAssignee(option)}
  >
    <Checkbox
      checked={isSelected(option)}
      // ✅ Single handler - only parent div onClick triggers toggleAssignee
    />
```

### Additional Safeguard: React Deduplication

Also add React deduplication to `vite.config.ts` to prevent potential duplicate React instance issues:

```typescript
export default defineConfig(({ mode }) => ({
  // ... existing config
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
```

### Files Summary

| File | Change |
|------|--------|
| `src/components/todos/AssigneeSelector.tsx` | Remove `onCheckedChange` and `onClick` from Checkbox |
| `vite.config.ts` | Add `dedupe` for React to prevent duplicate instances |

### Expected Outcome

After this fix:
- Clicking anywhere on the assignee row will toggle selection
- No more double-triggering of `toggleAssignee`
- Multi-assignee selection will work correctly for Self, Operators, Team Members, and Partners

