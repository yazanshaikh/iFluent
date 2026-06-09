# 🔍 iFluent Student App — Comprehensive Debugging Guide

## Overview
This guide documents all console.log points added throughout the student app to trace data flow from API requests through component rendering.

---

## 📊 Data Flow Logging Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROOT LAYOUT ([ROOT-LAYOUT])                │
│  • Hydrates auth store (token + user from SecureStore)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    TABS LAYOUT ([TABS-LAYOUT])                  │
│  • Checks if hydrated + token exists                            │
│  • Redirects to auth or tabs based on login state               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              SESSIONS TAB ([SESSIONS-TAB])                      │
│  • Fetches sessions list via API                                │
│  • Filters: upcoming (active+waiting) vs done (completed+cancelled) │
│  • Shows SessionListItem cards with status badges              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (user taps session card)
┌─────────────────────────────────────────────────────────────────┐
│         SESSION PROFILE SCREEN ([SESSION-PROFILE])              │
│  • Fetches session profile via API                              │
│  • Subscribes to Reverb WebSocket for real-time updates        │
│  • Shows join button when status becomes 'active'              │
│  • Displays waiting/completed states                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (user taps join button)
┌─────────────────────────────────────────────────────────────────┐
│          SESSION ROOM SCREEN ([SESSION-ROOM])                   │
│  • Polls /join endpoint until room is ready                     │
│  • Shows Daily.co WebView (video) + Nearpod WebView (content) │
│  • Displays Nearpod PIN overlay                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 API Layer Logging

### `/apps/frontend-student/src/api/client.ts`

#### Request Interceptor
```javascript
[API-CLIENT] Request: GET http://192.168.0.104:8000/api/v1/student/sessions/123/profile
  hasToken: true
  tokenLength: 256
```

#### Response Interceptor
```javascript
[API-CLIENT] Response: GET http://192.168.0.104:8000/api/v1/student/sessions/123/profile => 200
```

#### Error Interceptor
```javascript
[API-CLIENT] Error: GET http://192.168.0.104:8000/api/v1/student/sessions/123/join => 422
  message: Request failed with status code 422
  responseData: { message: "Session not active yet" }
```

---

### `/apps/frontend-student/src/api/sessions.ts`

#### getProfile()
```javascript
[SESSIONS-API] getProfile(123)
[SESSIONS-API] getProfile(123) success: {
  id: 123,
  status: 'active',
  attendance_status: null,
  scheduled_at: '2026-06-08T14:00:00Z',
  ...
}
```

#### joinSession()
```javascript
[SESSIONS-API] joinSession(123)
[SESSIONS-API] joinSession(123) success: {
  session_id: 123,
  status: 'active',
  daily_room_url: 'https://ifluentnew.daily.co/...',
  nearpod_pin: '1234567',
  nearpod_url: 'https://nearpod.com/...',
  ...
}
```

---

## 🏪 Store Layer Logging

### `/apps/frontend-student/src/stores/authStore.ts`

#### hydrate()
```javascript
[AUTH-STORE] Hydrating...
[AUTH-STORE] Hydrated: { hasToken: true, userId: 42 }
```

---

## 🎯 Screen-Level Logging

### `/apps/frontend-student/app/_layout.tsx` (Root Layout)
```javascript
[ROOT-LAYOUT] Mounting, hydrating auth store...
[ROOT-LAYOUT] Auth store hydrated
```

### `/apps/frontend-student/app/(tabs)/_layout.tsx` (Tabs Layout)
```javascript
[TABS-LAYOUT] Render: { hydrated: true, hasToken: true }
// or
[TABS-LAYOUT] No token, redirecting to auth...
```

### `/apps/frontend-student/app/(tabs)/sessions.tsx` (Sessions Tab)
```javascript
[SESSIONS-TAB] Fetching sessions...
[SESSIONS-TAB] Sessions fetched: 5
[SESSIONS-TAB] Fetching bookings...
[SESSIONS-TAB] Bookings fetched: 2
```

### `/apps/frontend-student/app/session-profile/[id].tsx` (Session Profile)

#### URL Params Parsing
```javascript
[SESSION-PROFILE] Parsed URL params: { id: '123', sessionId: 123 }
```

#### Hero Section Rendering
```javascript
[SESSION-PROFILE] Rendering hero section with lesson: "English Lesson Title"
```

#### Reverb WebSocket Setup
```javascript
[SESSION-PROFILE] Reverb setup: { sessionId: 123, token: 'present', userId: 42 }
[SESSION-PROFILE] Connecting to Reverb... student.42
[SESSION-PROFILE] Subscribed to channel, listening for events...
```

#### Real-time Event Reception
```javascript
[SESSION-PROFILE] .session.activated received: {
  session_id: 123,
  status: 'active',
  daily_room_url: 'https://ifluentnew.daily.co/...',
  nearpod_pin: '1234567',
  nearpod_url: 'https://nearpod.com/...'
}
[SESSION-PROFILE] Event is for THIS session (123), setting rtData.status=active
```

#### Profile Data Fetching
```javascript
[SESSION-PROFILE] Fetching profile for session 123...
[SESSION-PROFILE] Profile fetched: {
  id: 123,
  status: 'waiting',
  scheduled_at: '2026-06-08T14:00:00Z',
  ...
}
```

#### Component State
```javascript
[SESSION-PROFILE] Component render: {
  sessionId: 123,
  isLoading: false,
  isError: false,
  rawData: { status: 'active', id: 123 },
  rtData: { status: 'active' },
  mergedData: { status: 'active', id: 123 }
}
```

#### Join Button Press
```javascript
[SESSION-PROFILE] Join button pressed, sessionId: 123
```

#### State Transitions
```javascript
[SESSION-PROFILE] Rendering Join button, data.id: 123
[SESSION-PROFILE] Rendering "waiting" state, minsUntil: 2.5
[SESSION-PROFILE] Rendering "5min until" state
```

#### Cleanup
```javascript
[SESSION-PROFILE] Cleanup: unsubscribing from events
```

### `/apps/frontend-student/app/session/[id].tsx` (Session Room)

#### URL Params
```javascript
[SESSION-ROOM] Parsed URL params: { id: '123', sessionId: 123 }
```

#### Join Endpoint Polling
```javascript
[SESSION-ROOM] Calling joinSession(123)...
[SESSION-ROOM] joinSession(123) success: { session_id: 123, ... }
[SESSION-ROOM] joinSession retry: count=0, status=422
```

#### Room Ready State
```javascript
[SESSION-ROOM] useEffect: data changed, checking if ready... {
  hasData: true,
  hasDailyUrl: true,
  hasNearpodPin: true
}
[SESSION-ROOM] Room ready! Setting roomData and joined=true
```

#### Component Render State
```javascript
[SESSION-ROOM] Component render: {
  sessionId: 123,
  isLoading: false,
  error: null,
  hasRoomData: true,
  joined: true,
  isEnded: false
}
```

#### WebView Loading
```javascript
[SESSION-ROOM] Rendering Daily.co WebView with URL: https://ifluentnew.daily.co/...
[SESSION-ROOM] Daily.co WebView onLoadStart
[SESSION-ROOM] Daily.co WebView onLoadEnd
[SESSION-ROOM] Daily.co WebView onShouldStartLoadWithRequest

[SESSION-ROOM] Rendering Nearpod WebView with URL: https://nearpod.com/...
[SESSION-ROOM] Nearpod WebView onLoadStart
[SESSION-ROOM] Nearpod WebView onLoadEnd
```

### `/apps/frontend-student/src/lib/echo.ts` (WebSocket Setup)

#### Echo Instance Creation
```javascript
[ECHO] getEcho() called, echoInstance exists: false
[ECHO] Creating new Echo instance... {
  host: '192.168.0.106',
  port: 8080,
  key: 'cxar16zcqn1j6y4fbprx',
  authEndpoint: 'http://192.168.0.106:8000/broadcasting/auth'
}
[ECHO] Echo instance created
```

#### Reusing Instance
```javascript
[ECHO] getEcho() called, echoInstance exists: true
[ECHO] Returning existing instance
```

---

## 🔍 How to Debug

### Step 1: Check Initial Load
1. Open Xcode or Android Studio console
2. Look for `[ROOT-LAYOUT] Mounting...` — confirms app started
3. Look for `[AUTH-STORE] Hydrated:` — confirms auth state loaded
4. Look for `[TABS-LAYOUT] Render:` — confirms navigation initialized

### Step 2: Check Sessions List
1. Navigate to Sessions tab
2. Look for `[SESSIONS-TAB] Fetching sessions...`
3. Look for `[API-CLIENT] Request: GET /student/sessions`
4. Look for `[API-CLIENT] Response: GET /student/sessions => 200`
5. Look for `[SESSIONS-TAB] Sessions fetched: X`

### Step 3: Check Session Profile Load
1. Tap a session card
2. Look for `[SESSION-PROFILE] Parsed URL params:` — confirms URL parsing
3. Look for `[SESSION-PROFILE] Reverb setup:` — confirms auth token
4. Look for `[API-CLIENT] Request: GET /student/sessions/{id}/profile`
5. Look for `[SESSIONS-API] getProfile({id}) success:` — confirms data fetch
6. Look for `[SESSION-PROFILE] Component render:` — confirms state

### Step 4: Check Real-time Updates
1. Teacher starts the session
2. Look for `[SESSION-PROFILE] .session.activated received:` — confirms Reverb works
3. Look for `[SESSION-PROFILE] Event is for THIS session` — confirms right session
4. Look for `[SESSION-PROFILE] Join button pressed` — confirms button rendered
5. Look for Component re-render with `status: 'active'` in `mergedData`

### Step 5: Check Join Endpoint
1. Tap Join button
2. Look for `[SESSION-ROOM] Parsed URL params:` — confirms navigation
3. Look for `[SESSION-ROOM] Calling joinSession({id})...` — confirms polling started
4. Look for `[API-CLIENT] Request: GET /student/sessions/{id}/join => 422` — session not active yet
5. Look for `[SESSION-ROOM] joinSession retry: count=0, status=422` — confirms retry
6. Look for `[SESSION-ROOM] joinSession({id}) success:` — confirms room ready
7. Look for `[SESSION-ROOM] Room ready! Setting roomData and joined=true` — confirms UI update

### Step 6: Check WebView Loading
1. Once join succeeds
2. Look for `[SESSION-ROOM] Rendering Daily.co WebView with URL:`
3. Look for `[SESSION-ROOM] Daily.co WebView onLoadStart`
4. Look for `[SESSION-ROOM] Daily.co WebView onLoadEnd` — indicates page loaded
5. Same checks for Nearpod WebView

---

## 📍 Common Debug Patterns

### Problem: "Blank Screen on Session Profile"
Check logs in this order:
1. ✅ `[SESSION-PROFILE] Parsed URL params:` — URL params?
2. ✅ `[API-CLIENT] Request:` for profile endpoint — Network request made?
3. ✅ `[SESSIONS-API] getProfile(...)` success — API returned data?
4. ✅ `[SESSION-PROFILE] Component render:` with `rawData` — State updated?
5. ❌ If no Hero section logs — Check if Hero is rendering at all

### Problem: "Join Button Doesn't Appear"
Check logs in this order:
1. ✅ `[SESSION-PROFILE] Reverb setup:` with token — Auth present?
2. ✅ `[SESSION-PROFILE] Subscribed to channel` — WebSocket connected?
3. ✅ Teacher side: check if SessionActivated event is firing
4. ✅ `[SESSION-PROFILE] .session.activated received:` — Event received?
5. ❌ `Event is for THIS session` vs `Event is for different session` — Wrong session ID?
6. ❌ `[SESSION-PROFILE] Component render:` shows `status: 'waiting'` — Event didn't update state

### Problem: "Session Room Shows White/Blank"
Check logs in this order:
1. ✅ `[SESSION-ROOM] Parsed URL params:` — Navigation successful?
2. ✅ `[SESSION-ROOM] Calling joinSession` — Polling started?
3. ✅ `[SESSION-ROOM] Room ready! Setting roomData` — Room data received?
4. ✅ `[SESSION-ROOM] Rendering Daily.co WebView` — WebView mount attempted?
5. ✅ `Daily.co WebView onLoadStart` → `onLoadEnd` — WebView loaded?
6. ❌ If no WebView logs — Check if `joined=true` and `roomData` exist
7. ❌ If WebView doesn't end loading — URL invalid or network issue

### Problem: "Reverb WebSocket Not Connecting"
Check logs in this order:
1. ✅ `[SESSION-PROFILE] Reverb setup:` shows `token: 'present'` — Token available?
2. ✅ `[ECHO] Creating new Echo instance` with correct host/port — Config right?
3. ✅ `[ECHO] Echo instance created` — Instance created successfully?
4. ✅ `[SESSION-PROFILE] Subscribed to channel` — Subscription successful?
5. ❌ Missing events — Check teacher side is broadcasting correctly
6. ❌ No `[ECHO]` logs — Echo not being initialized (check useEffect dependencies)

---

## 🎬 Full Session Flow Example

```
[ROOT-LAYOUT] Mounting, hydrating auth store...
[AUTH-STORE] Hydrating...
[AUTH-STORE] Hydrated: { hasToken: true, userId: 42 }
[ROOT-LAYOUT] Auth store hydrated
[TABS-LAYOUT] Render: { hydrated: true, hasToken: true }
[SESSIONS-TAB] Fetching sessions...
[API-CLIENT] Request: GET http://192.168.0.104:8000/api/v1/student/sessions
[API-CLIENT] Response: GET http://192.168.0.104:8000/api/v1/student/sessions => 200
[SESSIONS-TAB] Sessions fetched: 3

// User taps session card
[SESSION-PROFILE] Parsed URL params: { id: '123', sessionId: 123 }
[SESSION-PROFILE] Reverb setup: { sessionId: 123, token: 'present', userId: 42 }
[ECHO] getEcho() called, echoInstance exists: false
[ECHO] Creating new Echo instance... { host: '192.168.0.106', port: 8080, ... }
[ECHO] Echo instance created
[SESSION-PROFILE] Connecting to Reverb... student.42
[SESSION-PROFILE] Subscribed to channel, listening for events...
[API-CLIENT] Request: GET http://192.168.0.104:8000/api/v1/student/sessions/123/profile
[SESSIONS-API] getProfile(123)
[API-CLIENT] Response: GET http://192.168.0.104:8000/api/v1/student/sessions/123/profile => 200
[SESSIONS-API] getProfile(123) success: { id: 123, status: 'waiting', ... }
[SESSION-PROFILE] Rendering hero section with lesson: "English Lesson Title"
[SESSION-PROFILE] Component render: { sessionId: 123, isLoading: false, rawData: { ... } }

// Teacher starts session (event received via Reverb)
[SESSION-PROFILE] .session.activated received: { session_id: 123, status: 'active', ... }
[SESSION-PROFILE] Event is for THIS session (123), setting rtData.status=active
[SESSION-PROFILE] Rendering Join button, data.id: 123
[SESSION-PROFILE] Component render: { ..., mergedData: { status: 'active', ... } }

// User taps Join button
[SESSION-PROFILE] Join button pressed, sessionId: 123
[SESSION-ROOM] Parsed URL params: { id: '123', sessionId: 123 }
[SESSION-ROOM] Calling joinSession(123)...
[API-CLIENT] Request: GET http://192.168.0.104:8000/api/v1/student/sessions/123/join
[SESSIONS-API] joinSession(123)
[API-CLIENT] Response: GET http://192.168.0.104:8000/api/v1/student/sessions/123/join => 200
[SESSIONS-API] joinSession(123) success: { session_id: 123, daily_room_url: '...', nearpod_pin: '1234567' }
[SESSION-ROOM] useEffect: data changed, checking if ready... { hasData: true, hasDailyUrl: true, hasNearpodPin: true }
[SESSION-ROOM] Room ready! Setting roomData and joined=true
[SESSION-ROOM] Component render: { ..., joined: true, hasRoomData: true }
[SESSION-ROOM] Rendering Daily.co WebView with URL: https://ifluentnew.daily.co/...
[SESSION-ROOM] Daily.co WebView onLoadStart
[SESSION-ROOM] Daily.co WebView onLoadEnd
[SESSION-ROOM] Rendering Nearpod WebView with URL: https://nearpod.com/...
[SESSION-ROOM] Nearpod WebView onLoadStart
[SESSION-ROOM] Nearpod WebView onLoadEnd
```

---

## 📱 Running with Logs

### Expo Go on iOS/Android
```bash
# Terminal 1: Start Expo dev server
cd /Users/yazan/Documents/crm_iFluent/apps/frontend-student
npx expo start

# Terminal 2: Watch logs
npx expo start --clear
# Then open app on device/simulator
# Logs appear in terminal automatically
```

### Android Studio
1. Click "Logcat" tab at bottom
2. Filter by process name or search for `[SESSION-PROFILE]`, `[API-CLIENT]`, etc.
3. Use Regex filter: `\[.*-.*\]` to show only tagged logs

### Xcode
1. Open Scheme → Edit Scheme → Arguments → Environment Variables
2. Or use Console.app to view system logs filtered by app name
3. Or use `xcrun simctl spawn booted log stream --predicate` to stream logs

---

## ✅ Verification Checklist

Run this checklist to verify logging is working:

- [ ] Root layout logs appear on app start
- [ ] Auth store hydration logs appear
- [ ] Tabs layout shows hydrated state
- [ ] Sessions tab shows fetch logs
- [ ] API client shows request/response logs
- [ ] Tapping session shows profile logs
- [ ] Reverb setup shows echo instance creation
- [ ] Teacher starts session → student receives activated event
- [ ] Join button appears after event received
- [ ] Tapping join → room logs appear
- [ ] Daily.co WebView loads (onLoadStart → onLoadEnd)
- [ ] Nearpod WebView loads
- [ ] No errors in response interceptor

---

**Last Updated:** June 8, 2026 | **Version:** 1.0
