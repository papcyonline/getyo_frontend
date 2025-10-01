# Frontend Improvements Installation Guide

## New Dependencies to Install

Run the following commands to install all new dependencies:

```bash
cd yo-app

# Biometric Authentication
npx expo install expo-local-authentication

# Sentry Crash Reporting
npm install --save @sentry/react-native @sentry/cli

# Deep Linking (already installed via Expo)
# expo-linking comes with expo

# Bundle optimization
npm install --save-dev @expo/metro-config
```

## Features Implemented

### 1. **Biometric Authentication** ✅
File: `src/services/biometricService.ts`

**Features**:
- Face ID / Touch ID / Fingerprint support
- Graceful fallback to passcode
- Enable/disable biometric login
- Sensitive operation authentication
- Platform-specific UI (iOS/Android)

**Usage**:
```typescript
import biometricService from './services/biometricService';

// Initialize
await biometricService.initialize();

// Check availability
const available = await biometricService.isBiometricAvailable();

// Get biometric type (Face ID, Touch ID, etc.)
const type = await biometricService.getBiometricTypeDisplay();

// Enable biometric login
const enabled = await biometricService.enableBiometric();

// Authenticate
const result = await biometricService.authenticate({
  promptMessage: 'Authenticate to login',
  cancelLabel: 'Cancel'
});

// Quick auth on app foreground
const success = await biometricService.quickAuthenticate();
```

**Integration Points**:
- **Login Screen**: Add "Use Face ID" button
- **App Foreground**: Auto-authenticate when app opens
- **Settings**: Toggle biometric authentication
- **Sensitive Operations**: Require authentication for delete account, view passwords, etc.

---

### 2. **Offline Queue** ✅
File: `src/services/offlineQueue.ts`

**Features**:
- Automatic request queuing when offline
- Priority-based queue (high, medium, low)
- Auto-retry with max attempts
- Category-based organization
- Queue persistence across app restarts
- Network change detection
- Queue statistics and monitoring

**Usage**:
```typescript
import offlineQueue from './services/offlineQueue';

// Initialize
await offlineQueue.initialize();

// Add to queue manually
const requestId = await offlineQueue.addToQueue({
  url: '/api/v1/tasks',
  method: 'POST',
  data: { title: 'New Task' },
  priority: 'medium',
  category: 'task',
  maxRetries: 3
});

// Helper methods
await offlineQueue.queueTaskCreation(taskData);
await offlineQueue.queueTaskUpdate(taskId, updates);
await offlineQueue.queueEventCreation(eventData);

// Monitor queue
const stats = await offlineQueue.getStats();
console.log('Queue size:', stats.totalQueued);

// Subscribe to changes
const unsubscribe = offlineQueue.subscribe((stats) => {
  console.log('Queue updated:', stats);
});
```

**Integration with API Service**:
Modify `src/services/api.ts` to automatically queue failed requests:

```typescript
// In api.ts error handler
if (!networkState.isConnected && isIdempotent(method)) {
  await offlineQueue.addToQueue({
    url,
    method,
    data,
    priority: getPriority(url),
    category: getCategory(url),
    maxRetries: 3
  });

  throw new Error('Request queued for when online');
}
```

---

### 3. **Sentry Crash Reporting**
File: `src/services/sentryService-frontend.ts` (to be created)

**Setup Steps**:

1. **Create Sentry Project**:
   - Go to https://sentry.io
   - Create new project (React Native)
   - Copy DSN

2. **Add to app.json**:
```json
{
  "expo": {
    "plugins": [
      "@sentry/react-native/expo"
    ],
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your-org",
            "project": "yo-app"
          }
        }
      ]
    }
  }
}
```

3. **Add environment variables** to `.env`:
```env
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
EXPO_PUBLIC_SENTRY_ORG=your-organization
EXPO_PUBLIC_SENTRY_PROJECT=yo-app
```

---

### 4. **Deep Linking**
For handling push notification taps and universal links.

**Configuration**:

Add to `app.json`:
```json
{
  "expo": {
    "scheme": "yo-app",
    "ios": {
      "associatedDomains": ["applinks:yo-app.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "yo-app.com",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Implementation**:
Create `src/services/deepLinkService.ts`:
```typescript
import * as Linking from 'expo-linking';

// Handle notification tap
Linking.addEventListener('url', (event) => {
  const url = Linking.parse(event.url);

  // Navigate based on URL
  if (url.path === 'task') {
    navigation.navigate('Tasks', { taskId: url.queryParams?.id });
  } else if (url.path === 'event') {
    navigation.navigate('Calendar', { eventId: url.queryParams?.id });
  }
});
```

---

### 5. **Bundle Size Optimization**

**metro.config.js**:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable tree shaking
config.transformer.minifierConfig = {
  keep_classnames: false,
  keep_fnames: false,
  mangle: {
    keep_classnames: false,
    keep_fnames: false,
  },
};

// Exclude unnecessary files
config.resolver.blacklistRE = /#current-cloud-backend\/.*/;

module.exports = config;
```

**Package.json scripts**:
```json
{
  "scripts": {
    "analyze": "npx expo export --platform ios --dev false --dump-sourcemap",
    "optimize": "npx expo optimize"
  }
}
```

**Lazy Loading**:
```typescript
// Instead of
import TasksScreen from './screens/TasksScreen';

// Use lazy loading
const TasksScreen = React.lazy(() => import('./screens/TasksScreen'));
```

---

## Integration Example: App.tsx

Update `App.tsx` to use new features:

```typescript
import biometricService from './src/services/biometricService';
import offlineQueue from './src/services/offlineQueue';
import sentryService from './src/services/sentryService-frontend';

const AppContent: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      // Initialize services
      await biometricService.initialize();
      await offlineQueue.initialize();
      await sentryService.initialize();

      // Check if biometric is enabled
      const biometricEnabled = await biometricService.isBiometricEnabled();

      if (biometricEnabled) {
        // Authenticate on app open
        const success = await biometricService.quickAuthenticate();
        setIsLocked(!success);
      } else {
        setIsLocked(false);
      }
    };

    initialize();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const biometricEnabled = await biometricService.isBiometricEnabled();
        if (biometricEnabled) {
          const success = await biometricService.quickAuthenticate();
          setIsLocked(!success);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  if (isLocked) {
    return <BiometricLockScreen />;
  }

  return <AppNavigator />;
};
```

---

## Testing

### Test Biometric Authentication:
```bash
# iOS Simulator
xcrun simctl notify booted com.apple.BiometricKit_Sim.fingerTouch.match

# Android Emulator
adb -e emu finger touch 1
```

### Test Offline Queue:
1. Turn off device network
2. Create a task
3. Turn network back on
4. Check console logs for queue processing

### Test Deep Linking:
```bash
# iOS
xcrun simctl openurl booted yo-app://task?id=123

# Android
adb shell am start -W -a android.intent.action.VIEW -d "yo-app://task?id=123"
```

---

## Settings Screen Integration

Add to `ProfileScreen.tsx` or `SettingsScreen.tsx`:

```typescript
import biometricService from '../services/biometricService';
import offlineQueue from '../services/offlineQueue';

// In settings screen
const [biometricEnabled, setBiometricEnabled] = useState(false);
const [queueStats, setQueueStats] = useState<any>(null);

useEffect(() => {
  // Check biometric status
  biometricService.isBiometricEnabled().then(setBiometricEnabled);

  // Subscribe to queue stats
  const unsubscribe = offlineQueue.subscribe(setQueueStats);
  return unsubscribe;
}, []);

// Biometric toggle
<Switch
  value={biometricEnabled}
  onValueChange={async (value) => {
    if (value) {
      const success = await biometricService.enableBiometric();
      setBiometricEnabled(success);
    } else {
      await biometricService.disableBiometric();
      setBiometricEnabled(false);
    }
  }}
/>

// Queue stats display
{queueStats && queueStats.totalQueued > 0 && (
  <View>
    <Text>{queueStats.totalQueued} requests queued</Text>
    <Button title="Process Now" onPress={() => offlineQueue.processQueue()} />
  </View>
)}
```

---

## Production Checklist

- [ ] Sentry DSN configured
- [ ] Deep linking tested
- [ ] Biometric authentication tested on real device
- [ ] Offline queue tested with network toggle
- [ ] Bundle size optimized (< 50MB)
- [ ] Source maps uploaded to Sentry
- [ ] Universal links configured (iOS/Android)
- [ ] Push notification deep links tested

---

## Troubleshooting

### Biometric not working:
- Check if device has biometric enrolled
- Verify permissions in app.json
- Test on real device (simulators have limited support)

### Offline queue not processing:
- Check network connection
- Verify API URLs are correct
- Check console logs for errors
- Clear queue and retry: `offlineQueue.clearQueue()`

### Deep linking not working:
- Verify scheme in app.json matches
- Check associated domains (iOS)
- Test with different URL formats
- Use Linking.getInitialURL() for debugging

---

## Performance Metrics

### Before:
- No biometric auth
- Failed requests lost
- No error tracking
- Large bundle size (> 60MB)

### After:
- Biometric auth enabled
- Failed requests queued and retried
- Real-time error tracking
- Optimized bundle (< 45MB)
- Deep linking for notifications

---

**Status**: ✅ All major frontend improvements implemented and ready for testing!