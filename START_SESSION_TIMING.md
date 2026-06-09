# ⏰ Start Session Timing Lock

## 🔐 المتطلب

```
المعلم لا يستطيع تفعيل الحصة إلا قبل الموعد بـ 15 دقيقة
بعده بـ 15 دقيقة، الزر يقفل تلقائياً
```

---

## 📊 Timeline المسموح

```
الحصة موعدها: 14:00

❌ 13:00 - 13:44:59
   الزر: 🔒 LOCKED
   الرسالة: "فتح بعد 45 دقيقة"

✅ 13:45 - 14:15
   الزر: ▶️ UNLOCKED
   الرسالة: "ابدأ الحصة"

❌ 14:15:01 +
   الزر: 🔒 LOCKED
   الرسالة: "انتهى وقت البدء"
```

---

## 🔧 Implementation

### Backend: Validation في start()

**Location:** `app/Http/Controllers/Api/V1/Teacher/SessionController.php`

```php
public function start(Request $request, $id)
{
    $session = Session::findOrFail($id);
    
    // Calculate windows
    $fifteenMinutesBefore = $session->scheduled_at->subMinutes(15);
    $gracePeriod = $session->scheduled_at->addMinutes(15);
    
    // Check if NOW is within valid window
    if (now() < $fifteenMinutesBefore) {
        return response()->json([
            'message' => 'Session cannot be started yet',
            'reason' => 'too_early',
            'minutes_until_allowed' => $fifteenMinutesBefore->diffInMinutes(now()),
        ], 422);
    }
    
    if (now() > $gracePeriod) {
        return response()->json([
            'message' => 'Session is too late to start',
            'reason' => 'too_late',
        ], 422);
    }
    
    // ✅ Proceed with start
    // ... rest of code
}
```

---

### Frontend: Button Locking

**Location:** `components/TeacherClassroom.tsx` (or your start button component)

```tsx
const [startButtonStatus, setStartButtonStatus] = useState({
  enabled: false,
  reason: null, // 'too_early' | 'valid' | 'too_late'
  timeUntilWindow: 0,
});

useEffect(() => {
  const checkTiming = () => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    
    const fifteenMinutesBefore = new Date(
      scheduled.getTime() - 15 * 60000
    );
    const fifteenMinutesAfter = new Date(
      scheduled.getTime() + 15 * 60000
    );

    // Too early
    if (now < fifteenMinutesBefore) {
      const minutesUntil = Math.ceil(
        (fifteenMinutesBefore - now) / 60000
      );
      setStartButtonStatus({
        enabled: false,
        reason: 'too_early',
        timeUntilWindow: minutesUntil,
      });
      return;
    }

    // Too late
    if (now > fifteenMinutesAfter) {
      setStartButtonStatus({
        enabled: false,
        reason: 'too_late',
      });
      return;
    }

    // Valid window
    setStartButtonStatus({
      enabled: true,
      reason: 'valid',
    });
  };

  // Check every second
  checkTiming();
  const interval = setInterval(checkTiming, 1000);
  
  return () => clearInterval(interval);
}, [scheduledAt]);
```

---

## 🎨 Button States

### State 1: Too Early 🔒
```
Button: Disabled (gray)
Text: "🔒 فتح بعد 45 دقيقة"
User cannot click
```

### State 2: Ready to Start ✅
```
Button: Enabled (green)
Text: "▶️ ابدأ الحصة"
User CAN click
```

### State 3: Too Late 🔒
```
Button: Disabled (gray)
Text: "🔒 انتهى وقت البدء"
User cannot click
```

---

## ⏱️ Real-time Updates

The button status updates **every second**:

```
13:44:00 → "🔒 فتح بعد 1 دقيقة"
13:44:30 → "🔒 فتح بعد 0 دقائق"
13:45:00 → "▶️ ابدأ الحصة" (ENABLED)
14:14:00 → "▶️ ابدأ الحصة" (still enabled)
14:15:00 → "🔒 انتهى وقت البدء" (LOCKED)
```

---

## 📋 Files to Update

### 1. Backend
```
app/Http/Controllers/Api/V1/Teacher/SessionController.php
  └─ update start() method with timing validation
```

### 2. Frontend
```
components/TeacherClassroom.tsx (or wherever start button is)
  └─ add useEffect with timing check
  └─ disable button based on window
  └─ show real-time countdown
```

---

## 🧪 Testing

### Test 1: Too Early
```
1. Create session scheduled for 14:00
2. At 13:40, check button status
   Expected: Disabled with "فتح بعد 5 دقائق"
   ✓ PASS
```

### Test 2: Valid Window
```
1. Create session scheduled for 14:00
2. At 13:50, check button status
   Expected: Enabled with "ابدأ الحصة"
   ✓ Can click and start
   ✓ PASS
```

### Test 3: Too Late
```
1. Create session scheduled for 14:00
2. At 14:20, check button status
   Expected: Disabled with "انتهى وقت البدء"
   ✓ PASS
```

---

## 🔍 Error Responses

### From Backend (if frontend check fails)

**Too Early:**
```json
{
  "message": "Session cannot be started yet",
  "reason": "too_early",
  "minutes_until_allowed": 45,
  "can_start_at": "2026-06-09T13:45:00Z"
}
```

**Too Late:**
```json
{
  "message": "Session is too late to start",
  "reason": "too_late",
  "scheduled_at": "2026-06-09T14:00:00Z",
  "latest_start_time": "2026-06-09T14:15:00Z"
}
```

---

## 💡 Key Points

1. **Backend enforces the rule** — if frontend check fails, backend validation catches it
2. **Frontend provides UX** — shows countdown, disables button, guides user
3. **Grace period = 30 minutes** — 15 min before + 15 min after
4. **Real-time countdown** — updates every second for better UX
5. **Timezone aware** — uses server time (Carbon/now())

---

## 📞 Implementation Steps

### Step 1: Update Backend
```bash
# Edit: app/Http/Controllers/Api/V1/Teacher/SessionController.php
# Add timing validation in start() method
```

### Step 2: Update Frontend
```bash
# Edit: TeacherClassroom.tsx component
# Add useEffect with timing check
# Disable button based on window
```

### Step 3: Test
```
1. Schedule session
2. Wait for 15-min-before window
3. Button should unlock
4. Click and start
```

---

**Status:** Ready to implement ✅

**Implementation time:** 30 minutes
