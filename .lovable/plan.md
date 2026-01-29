

## Plan: Fix Project Card Action Buttons on Mobile

### Problem Summary

1. **View/Edit buttons not working on mobile** - The `ProjectCard` has a click handler that navigates to the project detail page, which conflicts with the button actions. The `onTouchEnd` and `onClick` handlers together can cause issues on mobile devices.

2. **Delete button overlapping with other icons** - All three action buttons are cramped in the top-right corner.

3. **Delete needs proper double verification** - Current `window.confirm()` dialogs are not user-friendly. Need a proper AlertDialog component with two-step confirmation.

---

### Solution

#### Part 1: Fix Button Click Handling

Remove `onTouchEnd` handlers (which can cause double-firing) and instead use a more reliable approach:
- Keep only `onClick` handlers
- Add `pointer-events-auto` to ensure buttons capture clicks
- Use `onPointerDown` with `e.stopPropagation()` to prevent the parent card from receiving the event

#### Part 2: Separate Delete Button Position

Move the delete button to a different position (bottom-right corner) to avoid overlapping and accidental taps. This also visually separates destructive actions from non-destructive ones.

#### Part 3: Proper AlertDialog for Delete Confirmation

Replace `window.confirm()` with a two-step AlertDialog:
1. First dialog: "Are you sure you want to delete this project?"
2. Second dialog (after clicking Continue): "This action cannot be undone. Type the project name to confirm."

---

### Implementation Details

**File: `src/pages/ProjectsPage.tsx`**

**Changes:**
1. Add state for delete confirmation dialogs
2. Replace `onTouchEnd` with `onPointerDown` for event capture
3. Move delete button to bottom-right of card
4. Create two-step AlertDialog for delete confirmation

```typescript
// New state for delete confirmation
const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
const [confirmationText, setConfirmationText] = useState('');

// Updated delete handler - opens first dialog
const handleDeleteProject = (project: Project) => {
  setProjectToDelete(project);
  setDeleteStep(1);
};

// Actual delete after confirmation
const confirmDelete = () => {
  if (!projectToDelete) return;
  
  dispatch({
    type: 'DELETE_PROJECT',
    payload: projectToDelete.id
  });
  
  toast({
    title: "Project Deleted",
    description: `Project "${projectToDelete.name}" has been permanently deleted.`,
    variant: "destructive"
  });
  
  setProjectToDelete(null);
  setConfirmationText('');
  setDeleteStep(1);
};
```

**Button Layout Changes:**
```tsx
{/* View and Edit buttons - top right */}
<div className="absolute top-3 right-3 flex gap-1.5 z-20">
  <Button size="sm" ... onClick={...}>
    <Eye />
  </Button>
  <Button size="sm" ... onClick={...}>
    <Edit />
  </Button>
</div>

{/* Delete button - bottom right, separate from other actions */}
<div className="absolute bottom-3 right-3 z-20">
  <Button size="sm" variant="destructive" ...>
    <Trash2 />
  </Button>
</div>
```

**AlertDialog for Delete Confirmation:**
```tsx
<AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
  <AlertDialogContent>
    {deleteStep === 1 ? (
      <>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{projectToDelete?.name}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={() => setDeleteStep(2)}>
            Continue
          </Button>
        </AlertDialogFooter>
      </>
    ) : (
      <>
        <AlertDialogHeader>
          <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All project data will be permanently deleted.
            Type "{projectToDelete?.name}" to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input 
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder="Type project name..."
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setDeleteStep(1); setConfirmationText(''); }}>
            Cancel
          </AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={confirmDelete}
            disabled={confirmationText !== projectToDelete?.name}
          >
            Delete Permanently
          </Button>
        </AlertDialogFooter>
      </>
    )}
  </AlertDialogContent>
</AlertDialog>
```

---

### Files Changed

| File | Changes |
|------|---------|
| `src/pages/ProjectsPage.tsx` | Fix button handlers, separate delete button position, add AlertDialog for two-step delete confirmation |

---

### Visual Layout After Fix

```text
+----------------------------------+
|  Project Name         [👁] [✏]  |  <- View/Edit top-right
|  Description...                  |
|                                  |
|  Project details...              |
|                                  |
|  Payment progress...     [🗑]   |  <- Delete bottom-right
+----------------------------------+
```

---

### Key Technical Points

1. **Remove `onTouchEnd`** - Using both `onClick` and `onTouchEnd` with the same action causes double-firing on some mobile browsers

2. **Add `onPointerDown` with `stopPropagation`** - This prevents the parent card's click from ever receiving the event

3. **Increase button touch targets** - Use larger buttons (h-9 w-9 instead of h-8 w-8) for better mobile usability

4. **AlertDialog over confirm()** - Native `confirm()` dialogs are not styled and can be dismissed accidentally. AlertDialog provides better UX and requires explicit user action

