# ✅ CRM Trial Bookings Real-Time Update

## 🎯 المشكلة:

```
CRM - Trial Bookings صفحة:
1. يعرض حجز تقييمي: status = "غير معين"
2. المعلم ينهي الحصة
3. CRM: ما بتحديث الحالة ❌
4. المدير بشوف: "غير معين" لحد ما يعيد تحميل يدوياً
5. بعد 24 ساعة: الحجز بختفي
```

---

## ✅ الحل المطبق:

### 1️⃣ **SessionController.end()**

**تعديل:**
```php
// ✅ عند انتهاء الحصة:
// 1. تحديث session status = 'completed'
// 2. تحديث SessionRequest status = 'confirmed'
// 3. تحديث updated_at timestamp (ليظهر في 24h window)

$sessionRequest = SessionRequest::where('session_id', $session->id)->first();
if ($sessionRequest) {
    $sessionRequest->update([
        'status'     => SessionRequest::STATUS_CONFIRMED,  // ← "منتهية"
        'updated_at' => $endedAt,
    ]);
}
```

**النتيجة:**
```
Session status: waiting → completed ✅
SessionRequest status: pending → confirmed ✅
CRM بتعرض: "منتهية" ✅
```

---

### 2️⃣ **DemoBookingController.all()**

**تعديل:**
```php
// ❌ BEFORE:
->where('updated_at', '>=', now()->subDays(2));  // ← 48 ساعة

// ✅ AFTER:
->where('updated_at', '>=', now()->subDay());  // ← 24 ساعة (per requirement)
```

---

## 📊 **الـ Timeline:**

```
15:00 → Teacher clicks "End Session"
        └─ Session.status = 'completed'
        └─ SessionRequest.status = 'confirmed'  ← ✅ Updated!
        └─ SessionRequest.updated_at = now()

15:00 → CRM Trial Bookings:
        ├─ Display: "منتهية" (instead of "غير معين")
        ├─ Visible in 24h window
        └─ Auto-hide after 24 hours

15:01 (next day) → Auto-hide from CRM
        └─ Not gone from DB, just hidden
```

---

## 🔧 **Files Changed:**

### Backend:
1. `/backend/app/Http/Controllers/Api/V1/Teacher/SessionController.php`
   - Lines 334-348: Added SessionRequest update
   - When session ends → update linked SessionRequest to 'confirmed'

2. `/backend/app/Http/Controllers/Api/V1/Crm/DemoBookingController.php`
   - Line 142: Changed from 48h to 24h window
   - Completed bookings hide after 24h (per requirement)

---

## ✨ **الآن:**

```
Teacher ends trial session
        ↓
SessionRequest.status = 'confirmed' ✅
        ↓
CRM shows: "منتهية"
        ↓
After 24h: Auto-hidden
```

---

## 🧪 **Test Case:**

```
1. Open CRM → Trial Bookings
2. See: "4 حصص تقييمية محجوزة"
3. Status shows: "غير معين"
4. Teacher ends session
5. CRM refreshes (poll every 5s)
6. Status updates to: "منتهية" ✅
7. After 24 hours: Hidden from list
```

---

## 📝 **Important Notes:**

- SessionRequest stays in DB (for history)
- Just hidden from CRM after 24h
- Pending bookings ALWAYS visible
- Completed bookings visible 24h only
