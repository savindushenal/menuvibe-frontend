# Loading State Guidelines

## Problem
Actions without loading indicators allow users to trigger duplicate operations (e.g., clicking "Create Menu" twice creates two menus).

## Solution Pattern

### 1. State Management
```tsx
const [isLoading, setIsLoading] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions
```

### 2. Button Implementation
```tsx
<Button
  onClick={handleAction}
  disabled={isLoading}
>
  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
  {isLoading ? 'Creating...' : 'Create Menu'}
</Button>
```

### 3. Action Handler Pattern
```tsx
const handleAction = async () => {
  if (isLoading) return; // Guard clause
  
  try {
    setIsLoading(true);
    await api.post('/endpoint', data);
    toast.success('Success');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Form Submission Pattern
```tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return; // Guard clause
  
  try {
    setIsSubmitting(true);
    await api.post('/endpoint', formData);
    toast.success('Saved successfully');
    onClose();
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsSubmitting(false);
  }
};

<form onSubmit={handleSubmit}>
  {/* form fields */}
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
    {isSubmitting ? 'Saving...' : 'Save'}
  </Button>
</form>
```

## Critical Areas Requiring Loading States

### High Priority (User-Facing Actions)
1. ✅ **Menu Creation** - `/dashboard/menus`
2. ✅ **Menu Item Creation/Update** - Menu item forms
3. ✅ **Location Creation** - `/dashboard/locations`
4. ✅ **Business Profile Updates** - `/dashboard/profile`
5. ✅ **Table/QR Code Creation** - `/dashboard/endpoints`
6. ✅ **Team Member Invitations** - Team management
7. ✅ **Settings Updates** - All settings pages
8. ✅ **Order Submissions** - Public menu orders

### Medium Priority (Admin Actions)
9. ✅ **Franchise Creation** - Admin panel
10. ✅ **User Management** - Admin user actions
11. ✅ **Subscription Changes** - Plan upgrades
12. ✅ **Help Ticket Creation** - Support forms

### Low Priority (Rare Actions)
13. Template duplication
14. Bulk operations
15. Export/Import actions

## Files Requiring Updates

### Immediate Fixes Needed
```
app/dashboard/menus/page.tsx - Menu creation
app/dashboard/locations/page.tsx - Location creation  
app/dashboard/endpoints/page.tsx - QR code creation
app/dashboard/profile/page.tsx - Profile updates
app/dashboard/settings/page.tsx - Settings saves
app/[franchise]/dashboard/branches/page.tsx - Branch creation
app/[franchise]/dashboard/team/page.tsx - Team invitations
app/[franchise]/dashboard/menus/master/page.tsx - Master menu creation
```

## Spinner Component
```tsx
import { Loader2 } from 'lucide-react';

<Loader2 className="h-4 w-4 mr-2 animate-spin" />
```

## Best Practices

1. **Always add guard clauses** - `if (isLoading) return;`
2. **Disable buttons during loading** - `disabled={isLoading}`
3. **Show loading text** - Change button text during operation
4. **Use try-finally** - Ensure loading state is reset even on error
5. **Toast feedback** - Always show success/error messages
6. **Prevent form resubmission** - Check isSubmitting in form handlers

## Anti-Patterns (Don't Do This)

❌ No loading state:
```tsx
<Button onClick={async () => await api.post('/menus')}>
  Create Menu
</Button>
```

❌ No disabled state:
```tsx
<Button onClick={handleCreate}>
  {isLoading ? 'Creating...' : 'Create'}
</Button>
```

❌ No guard clause:
```tsx
const handleCreate = async () => {
  setIsLoading(true); // Can be called multiple times!
  await api.post('/menus');
  setIsLoading(false);
};
```

## Implementation Checklist

For each action button/form:
- [ ] Add loading state variable
- [ ] Add guard clause in handler
- [ ] Set loading true before async operation
- [ ] Set loading false in finally block
- [ ] Disable button when loading
- [ ] Show spinner during loading
- [ ] Change button text during loading
- [ ] Show toast on success/error

## Using with Existing Components

### MenuItemForm Example
The `MenuItemForm` component already accepts `isLoading` prop. Use the hook in the parent component:

```tsx
import { useAsyncAction } from '@/hooks/use-async-action';

function MenuCustomization() {
  const { execute: executeAddItem, isLoading: isAddingItem } = useAsyncAction({
    successMessage: 'Menu item added successfully',
    onSuccess: () => refetchMenu(),
  });

  const handleAddItem = async (data: any, image?: File) => {
    await executeAddItem(async () => {
      const response = await api.post(`/menus/${menuId}/items`, data);
      if (image) {
        // Upload image if needed
        await uploadImage(response.data.id, image);
      }
      return response.data;
    });
  };

  return (
    <MenuItemForm
      menuId={menuId}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleAddItem}
      isLoading={isAddingItem}  // Pass loading state
      // ... other props
    />
  );
}
```

## Testing

To verify duplicate prevention:
1. Open network throttling (Slow 3G)
2. Click action button rapidly multiple times
3. Verify only ONE request is sent
4. Verify button becomes disabled immediately
5. Verify spinner appears
6. Verify success message shows once
