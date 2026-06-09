# ✅ CRM Trial Bookings - Status Display Fixed

## 🎯 المشكلة الأساسية:

```
الحصص المنتهية تظهر بـ "مؤكدة" بدل "منتهية" ❌

السبب: الـ CRM كان بيستخدم SessionRequest.status
لكن SessionRequest ما بتحديث لـ 'completed'
عشان مافيه status constant بـ SessionRequest لـ 'completed'
```

---

## ✅ الحل النهائي:

### 1️⃣ **Backend (DemoBookingController.all)**

**تعديل:**
```php
// ✅ Use Session.status if available (to show 'completed' as "منتهية")
'status' => $r->session?->status ?? $r->status,
```

**النتيجة:**
```
التسلسل الزمني:
┌─────────────────────────────────────────┐
│ SessionRequest created                  │
│ status = 'pending'                      │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Teacher accepts → Session created       │
│ SessionRequest.session_id = 5           │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Teacher ends session                    │
│ Session.status = 'completed'            │
│ CRM now shows: 'completed' ← ✅ Fixed!  │
└─────────────────────────────────────────┘
```

---

### 2️⃣ **Frontend (TrialBookings.tsx)**

**تعديل:**
```typescript
// ✅ Support both SessionRequest AND Session statuses
const STATUS_LABEL = {
  // SessionRequest
  pending: 'بانتظار التنفيذ',
  confirmed: 'مؤكدة',
  // Session
  waiting: 'بانتظار التنفيذ',
  active: 'نشطة الآن',
  completed: 'منتهية',  // ← Shows correctly now!
};

const STATUS_VARIANT = {
  completed: 'warning',  // ← Yellow badge for completed
};
```

---

## 📊 **Display Logic:**

```
API Response:
{
  status: 'completed',  // ← From Session (not SessionRequest)
  ...
}
        ↓
Frontend:
STATUS_LABEL['completed'] = 'منتهية'
STATUS_VARIANT['completed'] = 'warning'
        ↓
CRM Display:
[⚠️ منتهية]  ← Yellow badge
```

---

## 🔧 **Files Changed:**

### Backend:
1. `/backend/app/Http/Controllers/Api/V1/Crm/DemoBookingController.php`
   - Line 170: Load session relation
   - Line 179: Use `$r->session?->status ?? $r->status`
   - Backend now returns Session status when available

2. `/backend/app/Http/Controllers/Api/V1/Teacher/SessionController.php`
   - Line 340: Just update timestamp (not status anymore)
   - Simpler logic - Session.status is the source of truth

### Frontend:
1. `/apps/frontend-crm/src/pages/TrialBookings.tsx`
   - Lines 19-39: Added Session statuses to STATUS_LABEL and STATUS_VARIANT
   - Now handles: waiting, active, completed
   - 'completed' shows as "منتهية" with warning style

---

## ✨ **الآن:**

```
Session ends
    ↓
API returns: status = 'completed'
    ↓
CRM shows: "منتهية" ✅
    ✓ With yellow badge
    ✓ Visible for 24h
    ✓ Then auto-hidden
```

---

## 🧪 **Test:**

```
1. CRM → Trial Bookings
2. See pending: "بانتظار التنفيذ"
3. Teacher completes session
4. Status updates to: "منتهية" ✅
5. Badge color: yellow/warning
6. Auto-hidden after 24h
```

---

## 🎯 **Summary:**

| Step | Before | After |
|------|--------|-------|
| Session completes | Status: 'confirmed' ❌ | Status: 'completed' ✅ |
| CRM display | Shows: "مؤكدة" ❌ | Shows: "منتهية" ✅ |
| Badge color | Green | Yellow ⚠️ |
| Visibility | Infinite | 24 hours |
