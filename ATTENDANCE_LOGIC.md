# 📋 Attendance & Auto-Expiry System

## 🎯 المنطق الكامل

### الحالات الأربعة

#### ✅ الحالة 1: كل شيء تمام
```
Teacher joins ✓
Student joins ✓
Result: ATTENDED
Status: attended
Deduction: None
```

#### ❌ الحالة 2: الطالب غاب
```
Teacher joins ✓
Student doesn't join ✗
Result: STUDENT ABSENT
Status: absent
Deduction: -1 from student balance (student wasted booking)
Teacher: Gets paid (did their job)
```

#### ❌ الحالة 3: المعلم غاب
```
Teacher doesn't join ✗
(Doesn't matter if student joins or not)
Result: TEACHER ABSENT
Status: teacher_absent
Deduction: NONE (don't charge student)
Teacher: Doesn't get paid (teacher's fault)
```

#### ⏰ الحالة 4: الحصة تنتهي تلقائياً
```
Teacher pressed "Start" but:
- Didn't join room themselves, OR
- Joined but student never showed within 1 hour

Auto-end trigger: After 1 hour
Result: TEACHER ABSENT (auto-expired)
Deduction: NONE (don't charge student)
```

---

## 🔧 الكود المطلوب (3 ملفات)

### 1️⃣ Migration (Database)
```php
// Add columns to sessions table:
- teacher_present (boolean)
- student_present (boolean)
- teacher_started_at (timestamp)
- teacher_ended_at (timestamp)
```

**Location:** `database/migrations/YYYY_MM_DD_add_attendance_columns.php`

---

### 2️⃣ Service (Business Logic)
```php
// app/Services/SessionAttendanceService.php

determineAttendanceStatus($session)
  → Returns: 'attended' | 'absent' | 'teacher_absent'

calculateBalanceImpact($session)
  → Returns: ['deduct_from_student' => bool, ...]

markTeacherPresent($session)
  → Called when teacher presses "Start"

markStudentPresent($session)
  → Called when student presses "Join"

handleAutoExpiry()
  → Called every 5 minutes by scheduler
  → Ends sessions > 1 hour old
```

---

### 3️⃣ Controller (API Endpoints)
```php
// app/Http/Controllers/Api/V1/Teacher/SessionController.php

start($id)
  1. Create Daily.co room
  2. markTeacherPresent() ← IMPORTANT
  3. Broadcast to student
  4. Return signed room URL

end($id)
  1. determineAttendanceStatus()
  2. calculateBalanceImpact()
  3. Deduct from student if absent
  4. Mark as completed
  5. Delete Daily.co room
```

---

## 📊 Attendance Status Determination

```
┌─────────────────────────────────────────┐
│ Check: teacher_present?                 │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
       NO            YES
        │             │
        ↓             ↓
   teacher_absent   Check: student_present?
                     │
              ┌──────┴──────┐
              │             │
             NO            YES
              │             │
              ↓             ↓
           absent        attended ✓
```

---

## 🔄 Timeline Example

### Scenario: Student Absent
```
14:00 → Teacher presses "Start"
        markTeacherPresent(session) ✓
        teacher_present = true

14:05 → Student invited but doesn't join
        
14:55 → Teacher presses "End"
        determineAttendanceStatus():
          - teacher_present = true ✓
          - student_present = false ✗
          - Result: 'absent'
        
        calculateBalanceImpact():
          - deduct_from_student = true
        
        student.balance-- (deduct 1)
        Result: Student loses 1 session credit
```

### Scenario: Teacher Absent (Auto-Expire)
```
14:00 → Teacher presses "Start"
        teacher_present = true (they clicked the button)
        
But: Teacher doesn't actually join the video room
        
15:00 → Scheduler runs handleAutoExpiry()
        Session has been active > 1 hour
        teacher_present should be false (they didn't actually join)
        
        Status: 'completed'
        attendance_status: 'teacher_absent'
        
        Result: Student is NOT charged
                Teacher doesn't get paid
```

---

## 💾 Database Columns Added

```sql
ALTER TABLE sessions ADD COLUMN teacher_present BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN student_present BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN teacher_started_at TIMESTAMP NULL;
ALTER TABLE sessions ADD COLUMN teacher_ended_at TIMESTAMP NULL;
```

---

## 📝 Implementation Steps

### Step 1: Create Migration
```bash
php artisan make:migration add_attendance_columns_to_sessions_table
# Copy migration code
php artisan migrate
```

### Step 2: Create Service
```bash
# Create: app/Services/SessionAttendanceService.php
# Copy service code
```

### Step 3: Update Controller
```bash
# Update: app/Http/Controllers/Api/V1/Teacher/SessionController.php
# Replace methods with new code
```

### Step 4: Add Scheduler
```php
// In app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->call(function () {
        SessionAttendanceService::handleAutoExpiry();
    })->everyFiveMinutes();
}
```

### Step 5: Test
```
1. Teacher starts session → teacher_present = true
2. Student joins → student_present = true  
3. Teacher ends → attendance_status = 'attended'
4. Balance: No deduction

OR

1. Teacher starts session → teacher_present = true
2. Student doesn't join (waits > 1 hour)
3. Scheduler runs → Auto-ends as teacher_absent
4. Balance: No deduction to student
```

---

## 🔍 Key Differences

| Scenario | Attendance | Student Balance | Teacher Payment |
|----------|-----------|-----------------|-----------------|
| Both present | attended | ✓ No change | ✓ Paid |
| Student absent | absent | ✗ -1 | ✓ Paid |
| Teacher absent | teacher_absent | ✓ No change | ✗ Not paid |
| Auto-expired | teacher_absent | ✓ No change | ✗ Not paid |

---

## 🎯 Critical Points

1. **Teacher Presence** = Pressed "Start" button
   - Not = Didn't actually join video room
   - Need to track this separately from button press

2. **Student Presence** = Pressed "Join" button
   - Proves student made it to the classroom
   - If they don't press Join, they're absent

3. **Auto-Expiry** = Scheduler cleanup
   - Runs every 5 minutes
   - Ends sessions > 1 hour old
   - Assumes teacher didn't show (teacher's fault)

4. **Balance Deduction** = Only if student absent
   - NOT if teacher absent
   - Student shouldn't be punished for teacher's no-show

---

## 📞 Summary

```
✅ Teacher Present + Student Present
   → attended (both did their job)

❌ Teacher Present + Student Absent  
   → absent (student wasted a slot)
   → Deduct from student balance

❌ Teacher Absent (or auto-expired)
   → teacher_absent (teacher's fault)
   → Don't deduct from student
   → Teacher doesn't get paid

⏰ After 1 hour (auto-expire)
   → teacher_absent
   → Don't deduct from student
```

---

**Ready to implement!** 🚀
