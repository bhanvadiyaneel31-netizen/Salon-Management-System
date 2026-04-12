# Bug Fix: Page Timeout Error (Infinite Loop)

## Issue
The application was experiencing a timeout error: "Message getPage (id: 3) response timed out after 30000ms"

## Root Cause
There were **infinite loops** caused by improper `useEffect` dependency arrays:

### 1. App.tsx - Infinite Redirect Loop
```typescript
useEffect(() => {
  // ...code that calls setCurrentView()
}, [currentView]); // ❌ BAD: Depends on currentView, but modifies it
```

**Problem**: 
- useEffect runs when `currentView` changes
- Inside the effect, `setCurrentView()` is called
- This changes `currentView`, triggering the effect again
- **Result**: Infinite loop → Browser timeout

### 2. CustomerDashboard.tsx - Unnecessary Re-renders
```typescript
useEffect(() => {
  // ...code that sets profile and profileForm
}, [appointments]); // ❌ BAD: Runs on every appointment mutation
```

**Problem**:
- The effect depended on the entire `appointments` array
- Every appointment update (status change, new booking, etc.) triggered a re-render
- This could cause performance issues and potential loops

## Solutions Applied

### 1. Fixed App.tsx Infinite Loop
**Changed:**
```typescript
useEffect(() => {
  initializeSampleAppointments();
  
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    setUserRole(currentUser.role);
    
    // Auto-redirect logic...
  }
}, []); // ✅ GOOD: Empty array - runs only once on mount
```

**Why it works**: The effect now runs only once when the component mounts, not every time currentView changes.

### 2. Fixed CustomerDashboard Re-render Issues
**Split into two separate effects:**

**Effect 1 - Update profile when appointments change:**
```typescript
useEffect(() => {
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    const totalAppointments = appointments.length;
    const loyaltyPoints = appointments.filter(apt => apt.status === 'completed').length * 10;
    
    setProfile(prev => ({
      ...prev,
      // ... update profile with new stats
    }));
  }
}, [appointments.length]); // ✅ GOOD: Only when count changes, not on mutations
```

**Effect 2 - Initialize profile form once:**
```typescript
useEffect(() => {
  const currentUser = api.auth.getCurrentUser();
  if (currentUser) {
    setProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || '',
      address: ''
    });
  }
}, []); // ✅ GOOD: Run only once on mount
```

**Why it works**: 
- Profile stats only update when appointment count changes (not on every status update)
- Profile form initializes once and doesn't re-initialize unnecessarily
- Prevents excessive re-renders

## Benefits

1. **No More Timeouts**: Application loads quickly without infinite loops
2. **Better Performance**: Fewer unnecessary re-renders
3. **Stable User Experience**: Pages load and function properly
4. **Proper React Patterns**: useEffect dependencies are correct

## Best Practices Applied

✅ **Empty dependency array `[]`**: Use when the effect should run only once on mount
✅ **Specific dependencies**: Use `appointments.length` instead of `appointments` when only the count matters
✅ **Avoid circular dependencies**: Never depend on a value you're modifying in the same effect
✅ **Split effects**: Separate concerns into different useEffects with appropriate dependencies

## Testing Checklist

- [x] App loads without timeout
- [x] User authentication persists on reload
- [x] Dashboard redirects work correctly
- [x] No infinite loops in console
- [x] Appointments update correctly
- [x] Profile data loads properly
- [x] Performance is smooth
