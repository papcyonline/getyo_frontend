# Quick Updates Implementation Guide

## Changes Made

### 1. Floating Action Button (FAB)
- **TasksScreen**: Remove + icon from header, add FAB at bottom right
- **RemindersScreen**: Remove + icon from header, add FAB at bottom right
- **QuickNoteScreen**: Already has record button, no FAB needed (user confirmed)

### 2. Time Remaining Display in Donuts
Added helper function to format time as "Xd Xh Xm" format and display below each donut chart.

### 3. Close Button Navigation
Updated close buttons to navigate to Home screen with `{ openQuickActions: true }` parameter.

## Implementation Steps

### Step 1: Update TasksScreen.tsx
1. Remove + icon from header (line 446-451)
2. Add FAB component before closing </View> (after bottomSheet)
3. Add time formatting function
4. Update donut rendering to show time below
5. Update handleBackPress to navigate properly

### Step 2: Update RemindersScreen.tsx
Same changes as TasksScreen

### Step 3: Update HomeScreen.tsx
Add useEffect to check for `openQuickActions` route param and auto-open quick actions modal

## Code Changes

### Helper Function (add to both TasksScreen and RemindersScreen):
```typescript
// Format time remaining in days, hours, minutes
const formatTimeRemaining = (dueDate: string) => {
  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diff = due - now;

  if (diff <= 0) return 'Overdue';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};
```

### Updated Close Button Handler:
```typescript
const handleBackPress = () => {
  navigation.navigate('Home', { openQuickActions: true } as never);
};
```

### FAB Component (add before closing </View>):
```tsx
{/* Floating Action Button */}
<TouchableOpacity
  style={[styles.fab, { bottom: insets.bottom + 20 }]}
  onPress={handleAddTask}  // or handleAddReminder
  activeOpacity={0.8}
>
  <LinearGradient
    colors={['#C9A96E', '#E5C794']}
    style={styles.fabGradient}
  >
    <Ionicons name="add" size={28} color="#FFFFFF" />
  </LinearGradient>
</TouchableOpacity>
```

### FAB Styles (add to StyleSheet):
```typescript
fab: {
  position: 'absolute',
  right: 20,
  width: 56,
  height: 56,
  borderRadius: 28,
  shadowColor: '#C9A96E',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 8,
  elevation: 8,
  zIndex: 1000,
},
fabGradient: {
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
},
```

### Time Display Below Donut (update renderTask/renderReminder):
```tsx
<View style={styles.donutContainer}>
  <CircularProgress
    percentage={isCompleted ? 100 : timePercentage}
    color={timeColor}
    size={50}
    strokeWidth={4}
  />
  {/* Center Icon */}
  <View style={styles.donutCenter}>
    {/* ...icon code... */}
  </View>
  {/* Time Remaining Text */}
  <Text style={[styles.timeRemainingText, { color: timeColor }]}>
    {isCompleted ? 'Done' : formatTimeRemaining(item.dueDate)}
  </Text>
</View>
```

### Time Text Style:
```typescript
timeRemainingText: {
  fontSize: 9,
  fontWeight: '600',
  textAlign: 'center',
  marginTop: 2,
},
```

### HomeScreen Auto-Open QuickActions:
```typescript
// Add this useEffect in HomeScreen after existing effects
useEffect(() => {
  const params = navigation.getState().routes[navigation.getState().index].params as any;
  if (params?.openQuickActions) {
    // Delay to allow screen to settle
    setTimeout(() => {
      showQuickActions();
    }, 300);
  }
}, [navigation]);
```

## Testing

1. Open TasksScreen → See FAB at bottom right (+ icon in header removed)
2. See time remaining displayed below each donut as "2d 5h" or "3h 45m"
3. Click close button → Returns to Home with quick actions open
4. Same for RemindersScreen

## Files Modified

- [x] TasksScreen.tsx
- [x] RemindersScreen.tsx
- [x] HomeScreen.tsx
- [ ] QuickNoteScreen.tsx (No changes needed - has record button)
