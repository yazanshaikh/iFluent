# 🔧 Troubleshooting Guide — Session Entry Crash

## 🎯 Quick Checklist

If the app still crashes when entering a session, go through this checklist:

### ✅ Step 1: Verify Hydration is Working
```bash
# Watch for these logs in console/logcat:
[ROOT] Hydrating auth store...
[AUTH] Hydrated: userId=42
[ROOT] Auth store hydrated
```

**If missing:**
- ❌ Root layout not calling hydrate()
- ❌ Hydrate function not working
- **Fix:** Check `app/_layout.tsx` has the hydration useEffect

---

### ✅ Step 2: Verify UserId is Loaded
Before navigating to session, check:
```javascript
// Temporarily add to any screen
const userId = useAuthStore((s) => s.user?.id);
console.log('Current userId:', userId);  // Should be a number, not undefined
```

**If undefined:**
- ❌ Auth store user object not populated
- ❌ SecureStore not returning user data
- **Fix:** Check `hydrate()` function in authStore reads user correctly

---

### ✅ Step 3: Verify Session-Profile Guards Are Working
When you enter a session, look for:
```bash
[SESSION-PROFILE] Mounted: sessionId=123
[SESSION-PROFILE] Reverb: connecting to student.42
```

**If you see instead:**
```bash
[SESSION-PROFILE] Reverb: waiting for auth hydration...
```
- ✅ **GOOD**: App is waiting, guard is working
- Wait a moment, should see connecting message

**If you see:**
```bash
[SESSION-PROFILE] Reverb: blocked - token=true userId=false
```
- ❌ **BAD**: userId is still undefined!
- **Fix:** Check why auth store isn't populating user data

---

### ✅ Step 4: Check Echo Instance Creation
```bash
[ECHO] Creating Echo instance for Reverb...
[ECHO] Instance created successfully
```

**If you see instead:**
```bash
[ECHO] FATAL: Cannot create Echo instance without valid token
```
- ❌ Token is empty or invalid
- **Fix:** Check that token is being passed correctly from auth store

---

### ✅ Step 5: Verify No Other Early Connections
Search for other places trying to connect to Reverb:

```bash
grep -r "getEcho\|echo.private\|channel.listen" \
  /path/to/apps/frontend-student/app \
  --include="*.tsx" \
  --include="*.ts"
```

**What to look for:**
- Any `getEcho()` calls outside of a guard check
- Any `useEffect` with direct Reverb connection
- Any connection attempts in root layout or without auth check

---

## 🐛 Common Crash Scenarios

### Scenario 1: Crash on Session Entry with "Undefined" Error

**Symptom:**
```
java.lang.Throwable: ...
student.undefined
```

**Root Cause:** userId is undefined when connecting

**Solution:**
1. Check logs for `[AUTH] Hydrated: userId=none` → Auth failed to load
2. Check SecureStore is working: `adb shell pm grant com.yourapp android.permission.WRITE_SECURE_SETTINGS`
3. Check user data is being saved properly

---

### Scenario 2: Crash with "Invalid Token" Error

**Symptom:**
```
[ECHO] FATAL: Cannot create Echo instance without valid token
```

**Root Cause:** Token is missing or empty

**Solution:**
1. Check logs for `[AUTH] Hydrated: userId=42` — if present, token should be too
2. Verify login flow properly saves token
3. Check SecureStore setItemAsync is working

---

### Scenario 3: Crash with Network Error

**Symptom:**
```
Network error connecting to Reverb
WebSocket connection failed
```

**Root Cause:** Network issue, not auth issue

**Solution:**
1. Check backend Reverb server is running: `docker ps | grep reverb`
2. Check EXPO_PUBLIC_REVERB_HOST is correct
3. Check network connectivity: `adb shell ping 192.168.0.106`

---

### Scenario 4: Crash with "Channel Authorization Failed"

**Symptom:**
```
Reverb: Channel authorization failed
Broadcasting auth endpoint returned 401
```

**Root Cause:** Backend rejects the token for this channel

**Solution:**
1. Check backend `/broadcasting/auth` endpoint is working
2. Verify token format is correct
3. Check student ID in channel name matches authenticated user

---

## 🔍 Advanced Debugging

### Enable Maximum Logging
Create debug version with extra logs:

```javascript
// In session-profile/[id].tsx, add:
useEffect(() => {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  
  console.log('=== SESSION-PROFILE DEBUG ===');
  console.log('sessionId:', sessionId);
  console.log('hydrated:', hydrated);
  console.log('token exists:', !!token);
  console.log('token length:', token?.length ?? 0);
  console.log('userId:', userId);
  console.log('user object:', useAuthStore((s) => s.user));
  console.log('=== END DEBUG ===');
}, []);
```

### Check Redux DevTools (if available)
If using Redux/Zustand DevTools, inspect auth store state:
- Look for `hydrated: false` when it should be `true`
- Look for missing `user` object
- Look for `token` being null

### Manual Token Test
```javascript
// In any component, test manually:
import * as SecureStore from 'expo-secure-store';

useEffect(() => {
  SecureStore.getItemAsync('student_token').then((token) => {
    console.log('SecureStore token:', token ? 'present' : 'missing');
  });
  
  SecureStore.getItemAsync('student_user').then((user) => {
    console.log('SecureStore user:', user);
  });
}, []);
```

---

## 📋 Full Diagnostic Steps

Run this sequence to identify the exact failure point:

### 1. Clear Everything
```bash
# Android
adb shell pm clear com.yourapp
adb shell pm clear com.google.android.gms

# iOS
# Delete from Simulator completely
```

### 2. Start Fresh
```bash
npx expo start --clear
```

### 3. Watch Initialization
Open console and watch:
```
[ROOT] Hydrating auth store...
  ↓ (wait 2-3 seconds)
[AUTH] Hydrated: userId=?
  ↓
[ROOT] Auth store hydrated
```

**What to note:**
- Does it say `userId=none`? → Auth failed to load
- Does it say `userId=42`? → Auth loaded successfully

### 4. Navigate to Sessions Tab
Watch for:
```
[SESSIONS-TAB] Sessions: X items
```

**What to note:**
- Does the list appear?
- Are there any API errors?

### 5. Tap a Session Card
Watch for:
```
[SESSION-PROFILE] Mounted: sessionId=123
[SESSION-PROFILE] Reverb: connecting to student.XX
```

**What to note:**
- Does it mount?
- What's the student ID shown?

### 6. Check for Crash
- Are logs still flowing?
- Is the screen still visible?
- Any error messages?

---

## 🛠️ Common Fixes

### Fix 1: Force Hydration
If hydration isn't completing, force it in root layout:

```javascript
export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  // Force hydration on mount
  useEffect(() => {
    if (!hydrated) {
      hydrate().catch((err) => {
        console.error('[ROOT] Hydration error:', err);
        // Retry after 1 second
        setTimeout(() => hydrate(), 1000);
      });
    }
  }, []);

  return (...);
}
```

### Fix 2: Delay Navigation
If data loads too slowly, delay screen rendering:

```javascript
export default function SessionProfileScreen() {
  const hydrated = useAuthStore((s) => s.hydrated);
  
  // Don't render until hydrated
  if (!hydrated) {
    return <LoadingScreen />;  // Show loading until ready
  }

  return <SessionContent />;
}
```

### Fix 3: Check Network First
Before Reverb connection, verify network:

```javascript
import NetInfo from '@react-native-community/netinfo';

useEffect(() => {
  NetInfo.fetch().then((state) => {
    console.log('Network state:', {
      isConnected: state.isConnected,
      type: state.type,
    });
    
    if (!state.isConnected) {
      console.error('[SESSION-PROFILE] No internet connection');
      return;
    }
    
    // Only try Reverb if connected
    // ... rest of Reverb setup
  });
}, []);
```

---

## 📞 When to Ask for Help

If you've gone through all steps and still crash, provide:

1. **Full logcat output** from app start to crash
2. **Values logged** for: `hydrated`, `token`, `userId`
3. **Exact error message** from the crash
4. **Steps to reproduce** (what you did before crash)
5. **Backend status** (is Reverb running?)

With this info, the issue can be pinpointed quickly.

---

## ✅ Success Indicators

You'll know the fix worked when:

1. ✅ `[ROOT] Hydrating...` → `[AUTH] Hydrated: userId=42`
2. ✅ Can navigate to Sessions tab without crash
3. ✅ Can tap session card without crash
4. ✅ See `[SESSION-PROFILE] Reverb: connecting to student.42`
5. ✅ See `[ECHO] Instance created successfully`
6. ✅ No error dialogs or crashes
7. ✅ No `[ECHO] FATAL:` messages
8. ✅ No `undefined` in Reverb channel names

---

**Last Updated:** June 8, 2026

**Use this checklist systematically — it will identify exactly where the issue is**
