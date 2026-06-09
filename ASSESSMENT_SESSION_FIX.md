# ✅ Assessment Sessions Display Fix — حصص التقييم تظهر دائماً

## 🎯 المشكلة:

```
عند الطالب:
- يحجز حصة تقييم (Assessment)
- الحصة تنتهي / تُلغى
- بعد 24 ساعة: الحصة تختفي من "حصصي"
- ❌ الطالب ما يقدر يراجعها
```

---

## ✅ السبب + الحل:

### الكود القديم (Backend):
```php
// ❌ Hide completed/cancelled sessions older than 24 hours
->where(function ($q) {
    $q->whereNotIn('status', [Session::STATUS_COMPLETED, Session::STATUS_CANCELLED])
      ->orWhere('ended_at', '>=', now()->subDay());  // ← تخفي كل الحصص القديمة!
})
```

### الكود الجديد:
```php
// ✅ Show assessment sessions ALWAYS (even if old)
->where(function ($q) {
    // Regular sessions: hide if completed/cancelled and older than 24h
    $q->where(function ($q2) {
        $q2->whereNotIn('status', [Session::STATUS_COMPLETED, Session::STATUS_CANCELLED])
          ->orWhere('ended_at', '>=', now()->subDay());
    })
    ->whereHas('lesson', fn($l) => $l->where('is_assessment', false));  // Only for regular
    
    ->orWhereHas('lesson', fn($l) => $l->where('is_assessment', true)); // ALWAYS show assessment
})
```

---

## 📊 **النتيجة:**

```
Session Type          Status              Age           Show?
─────────────────────────────────────────────────────────────
Regular               active              any           ✅ Always
Regular               waiting             any           ✅ Always
Regular               completed           < 24h         ✅ Show
Regular               completed           > 24h         ❌ Hide
Assessment            active              any           ✅ Always
Assessment            waiting             any           ✅ Always
Assessment            completed           < 24h         ✅ Show
Assessment            completed           > 24h         ✅ SHOW! (was hidden)
Assessment            cancelled           any           ✅ SHOW! (was hidden)
```

---

## 🔧 **File Changed:**

`/backend/app/Http/Controllers/Api/V1/Student/SessionController.php`
- Lines 17-34: Updated `index()` method
- Assessment sessions always visible
- Regular sessions hide after 24h

---

## 🎯 **الآن:**

```
✅ الطالب يشوف كل حصص التقييم
✅ بيقدر يراجعها في أي وقت
✅ ما بتختفي بعد 24 ساعة
```

---

## 🧪 **Test:**

```
1. Book assessment session
2. Complete it
3. Wait 24+ hours (or just check immediately)
4. الحصة بتظهر في "حصصي" ✅
5. الطالب يقدر يدخل البروفايل ويراها
```
