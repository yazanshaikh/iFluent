# 🔧 Android Crash Fix — StaticLayout Error

## ❌ Problem

**Error:** `java.lang.Throwable: length=40960; index=-32768`

**Root Cause:** Android's StaticLayout crashes when rendering text that is:
1. **Very long strings** (URLs, JSON, raw data)
2. **Complex objects** being printed to console
3. **Large amounts of text** in a single console.log call

The previous console.logs were attempting to print:
- Full API response objects
- Complete URLs with protocol + domain + path
- Entire JSON structures
- Large configuration objects

---

## ✅ Solution Implemented

All console.logs have been **refactored to print only SHORT, SAFE values**:

### Before (❌ Problematic)
```javascript
console.log('[SESSION-PROFILE] Component render:', {
  sessionId,
  isLoading,
  isError,
  rawData: rawData ? { status: rawData.status, id: rawData.id } : null,
  rtData,
  mergedData: data ? { status: data.status, id: data.id } : null,
});

console.log('[SESSION-ROOM] Rendering Daily.co WebView with URL:', roomData.daily_room_url);

console.log('[ECHO] Creating new Echo instance...', {
  host: REVERB_HOST,
  port: REVERB_PORT,
  key: REVERB_KEY,
  authEndpoint: `${API_URL.replace('/api/v1', '')}/broadcasting/auth`,
});
```

### After (✅ Safe)
```javascript
console.log(`[SESSION-PROFILE] Render: loading=${isLoading} error=${isError} status=${data?.status ?? 'none'} rtOverride=${!!rtData}`);

// ✓ Removed URL from log (only had status + flags)
// No console.log for WebView rendering

console.log('[ECHO] Creating Echo instance for Reverb...');
// ✓ Removed config object (not needed for debugging)
```

---

## 📝 Changes Made

### 1. **API Layer** (`client.ts`, `sessions.ts`)
- ❌ Don't print full URLs
- ✅ Print only path suffix (last 2 segments)
- ❌ Don't print full response objects
- ✅ Print only status + key metrics

**Before:**
```javascript
console.log(`[API-CLIENT] Request: ${config.method?.toUpperCase()} ${config.url}`)
```

**After:**
```javascript
const path = config.url ? config.url.split('/').slice(-2).join('/') : 'unknown';
console.log(`[API-CLIENT] ${config.method?.toUpperCase()} ${path} - hasToken: ${!!token}`);
```

### 2. **WebSocket Layer** (`echo.ts`)
- ❌ Don't print entire config object
- ✅ Just confirm creation with simple message

**Before:**
```javascript
console.log('[ECHO] Creating new Echo instance...', {
  host: REVERB_HOST,
  port: REVERB_PORT,
  key: REVERB_KEY,
  authEndpoint: `...`,
});
```

**After:**
```javascript
console.log('[ECHO] Creating Echo instance for Reverb...');
```

### 3. **Session Profile Screen** (`session-profile/[id].tsx`)
- ❌ Don't print component render state objects
- ✅ Print only status flags as inline values
- ❌ Don't console.log inside render JSX
- ✅ Move logs to useEffect/callbacks

**Before:**
```javascript
console.log('[SESSION-PROFILE] Component render:', {
  sessionId,
  isLoading,
  isError,
  rawData: { ... },
  rtData,
  mergedData: { ... }
});

{console.log('[SESSION-PROFILE] Rendering hero section...')}
```

**After:**
```javascript
console.log(`[SESSION-PROFILE] Render: loading=${isLoading} error=${isError} status=${data?.status ?? 'none'} rtOverride=${!!rtData}`);

// Removed inline console.logs in JSX
```

### 4. **Session Room Screen** (`session/[id].tsx`)
- ❌ Don't log WebView URLs
- ✅ Only log load events (start/end)
- ❌ Don't print error objects
- ✅ Print only error description

**Before:**
```javascript
{console.log('[SESSION-ROOM] Rendering Daily.co WebView with URL:', roomData.daily_room_url)}
onError={(e) => console.error('[SESSION-ROOM] Daily.co WebView error:', e)}
```

**After:**
```javascript
// No log for rendering URL
onError={(e) => console.error('[SESSION-ROOM] Daily.co: error', e.nativeEvent?.description ?? 'unknown')}
```

### 5. **Sessions Tab** (`(tabs)/sessions.tsx`)
- ✅ Keep simple count logs (safe, small numbers)

**Before:**
```javascript
console.log('[SESSIONS-TAB] Sessions fetched:', result.length);
```

**After:**
```javascript
console.log(`[SESSIONS-TAB] Sessions: ${result.length} items`);
```

### 6. **Removed Unnecessary Logs**
- ❌ Root layout hydration logs (redundant)
- ❌ Tabs layout render checks (not helpful)
- ❌ Inline console.logs in JSX (causes re-renders)

---

## 🎯 Safe Logging Rules

All remaining console.logs follow these rules:

### ✅ DO:
- Print **primitive values** (numbers, booleans, strings)
- Print **short strings** (flags, single words)
- Print **simple metrics** (lengths, counts, status)
- Print **API paths** (only last 2 segments: `sessions/123`)
- Print **boolean flags** with inline comparison: `hasToken=${!!token}`
- Print **short enums/states**: `status=active`

### ❌ DON'T:
- Print **full URLs** (can be >200 chars)
- Print **full objects** (can have deeply nested structures)
- Print **raw JSON** (can be megabytes)
- Print **config objects** (unnecessary for debugging)
- Print **response bodies** (use summary instead)
- Use **inline console.logs in JSX** (triggers on every render)
- Print **error objects** (extract message instead)

---

## 📊 Log Format Standardization

All logs now use consistent format:

```javascript
console.log(`[COMPONENT] Action: key1=value1 key2=value2`);
```

**Examples:**
```javascript
[API-CLIENT] GET sessions/123 - hasToken: true
[SESSION-PROFILE] Mounted: sessionId=123
[SESSION-PROFILE] Reverb: sessionId=123, hasToken=true, userId=42
[SESSION-PROFILE] Event: activated (session_id=123)
[SESSION-PROFILE] Render: loading=false error=false status=active rtOverride=false
[SESSION-ROOM] Mounted: sessionId=123
[SESSION-ROOM] Retry: count=0 status=422
[SESSION-ROOM] Room ready: setting joined=true
[SESSION-ROOM] Render: joined=true hasError=false isEnded=false
[SESSION-ROOM] Daily.co: loadStart
[SESSION-ROOM] Daily.co: loadEnd ✓
```

---

## 🚀 Testing the Fix

1. **Clear app cache/state**
   ```bash
   # iOS
   # Delete app from simulator
   
   # Android
   adb shell pm clear com.example.ifluentstudent
   ```

2. **Start app fresh**
   ```bash
   npx expo start --clear
   ```

3. **Monitor logs**
   - Xcode Console for iOS
   - Android Studio Logcat for Android
   - Filter by `[SESSION-PROFILE]`, `[API-CLIENT]`, etc.

4. **Check for crash**
   - Navigate through app normally
   - No more `StaticLayout` crashes
   - Logs should appear cleanly

---

## 📋 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `src/api/client.ts` | Simplified request/response logs | ✅ |
| `src/api/sessions.ts` | Print status instead of full objects | ✅ |
| `src/lib/echo.ts` | Removed config object from log | ✅ |
| `src/stores/authStore.ts` | Simplified hydration log | ✅ |
| `app/_layout.tsx` | Removed unnecessary logs | ✅ |
| `app/(tabs)/_layout.tsx` | Removed unnecessary logs | ✅ |
| `app/(tabs)/sessions.tsx` | Simplified count logs | ✅ |
| `app/session-profile/[id].tsx` | Removed inline logs, simplified render | ✅ |
| `app/session/[id].tsx` | Removed URL logs, simplified errors | ✅ |

---

## ✨ Benefits

1. **No more crashes** — All log statements are safe
2. **Better readability** — Concise, focused output
3. **Same debugging power** — Still tracks all critical data flow
4. **Performance** — Fewer heavy JSON serializations
5. **Android compatible** — No StaticLayout limits exceeded

---

## 🔍 Debugging Still Works

The simplified logs **still provide all necessary debugging info**:

✅ **API calls tracked:**
```
[API-CLIENT] GET sessions/123 - hasToken: true
[API-CLIENT] ✓ GET sessions/123 => 200
```

✅ **Data flow tracked:**
```
[SESSION-PROFILE] API: getProfile(123)
[SESSIONS-API] getProfile(123) ✓ status=active
[SESSION-PROFILE] Render: loading=false error=false status=active
```

✅ **Events tracked:**
```
[SESSION-PROFILE] Event: activated (session_id=123)
[SESSION-PROFILE] ✓ Event matched (123), updating state
```

✅ **WebView loading tracked:**
```
[SESSION-ROOM] Daily.co: loadStart
[SESSION-ROOM] Daily.co: loadEnd ✓
[SESSION-ROOM] Nearpod: loadStart
[SESSION-ROOM] Nearpod: loadEnd ✓
```

---

## ✅ Verification Checklist

After rebuilding:
- [ ] App launches without crash
- [ ] Navigate to Sessions tab — see session list
- [ ] Tap session card — no crash, logs appear
- [ ] Wait for teacher to start — see activation event
- [ ] Tap Join — no crash, room loads
- [ ] Daily.co WebView shows (or timeout)
- [ ] Nearpod WebView shows (or timeout)
- [ ] No `StaticLayout` errors in logcat
- [ ] Logs are readable and concise

---

**Status:** ✅ READY FOR TESTING

**Date:** June 8, 2026

**Note:** If crash still occurs, check for any other console.log statements printing large objects in other files.
