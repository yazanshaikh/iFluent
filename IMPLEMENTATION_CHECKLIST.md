# ✅ Implementation Checklist — Attendance & Auto-Expiry

## 🔧 Files to Create/Modify

### Phase 1: Database (10 min)
- [ ] Create migration file: `database/migrations/2024_XX_XX_add_attendance_columns.php`
  - Add `teacher_present` (boolean)
  - Add `student_present` (boolean)
  - Add `teacher_started_at` (timestamp)
  - Add `teacher_ended_at` (timestamp)
- [ ] Run: `php artisan migrate`

### Phase 2: Service (15 min)
- [ ] Create: `app/Services/SessionAttendanceService.php`
  - Implement `determineAttendanceStatus()`
  - Implement `calculateBalanceImpact()`
  - Implement `markTeacherPresent()`
  - Implement `markStudentPresent()`
  - Implement `handleAutoExpiry()`

### Phase 3: Controller (20 min)
- [ ] Update: `app/Http/Controllers/Api/V1/Teacher/SessionController.php`
  - Modify `start()` method:
    - Add `SessionAttendanceService::markTeacherPresent($session)`
  - Modify `end()` method:
    - Add `determineAttendanceStatus()`
    - Add `calculateBalanceImpact()`
    - Add balance deduction logic
  - Modify `join()` method (student):
    - Add `SessionAttendanceService::markStudentPresent($session)`

### Phase 4: Scheduler (10 min)
- [ ] Update: `app/Console/Kernel.php`
  - Add to `schedule()`:
    ```php
    $schedule->call(function () {
        SessionAttendanceService::handleAutoExpiry();
    })->everyFiveMinutes();
    ```

### Phase 5: Tests (optional)
- [ ] Create tests for attendance logic
- [ ] Test auto-expiry scheduler

---

## 🧪 Testing Scenarios

### Test 1: Both Present ✅
```
1. Teacher presses "Start"
   Check: teacher_present = true ✓
   
2. Student presses "Join"
   Check: student_present = true ✓
   
3. Teacher presses "End"
   Expected: attendance_status = 'attended'
   Expected: student.balance = unchanged
   ✓ PASS
```

### Test 2: Student Absent ❌
```
1. Teacher presses "Start"
   Check: teacher_present = true ✓
   
2. Student doesn't join
   Check: student_present = false ✓
   
3. Teacher presses "End"
   Expected: attendance_status = 'absent'
   Expected: student.balance -= 1
   ✓ PASS
```

### Test 3: Teacher Absent ❌
```
1. Teacher presses "Start"
   Check: teacher_present = true
   
   BUT: Teacher doesn't actually join video
   
2. After 1 hour, scheduler runs
   Expected: status = 'completed'
   Expected: attendance_status = 'teacher_absent'
   Expected: student.balance = unchanged
   ✓ PASS
```

### Test 4: Auto-Expiry ⏰
```
1. Create session
2. Set started_at = 1.5 hours ago
3. Run handleAutoExpiry()
   Expected: status = 'completed'
   Expected: attendance_status = 'teacher_absent'
   Expected: student.balance = unchanged
   ✓ PASS
```

---

## 🚀 Deployment Steps

### Step 1: Backup
```bash
# Backup database first
mysqldump -u user -p ifluentdb > backup.sql
```

### Step 2: Deploy Code
```bash
# Pull changes
git pull origin main

# Install any new dependencies
composer install

# Create migration
php artisan make:migration add_attendance_columns_to_sessions_table

# Run migration
php artisan migrate
```

### Step 3: Verify
```bash
# Check database columns exist
php artisan tinker
# Check columns: Schema::getColumns('sessions')

# Test service
SessionAttendanceService::determineAttendanceStatus($session)
```

### Step 4: Monitor
```bash
# Watch logs for auto-expiry runs
tail -f storage/logs/laravel.log | grep "auto-expired"
```

---

## 📋 Expected Database State

### sessions table changes
```sql
DESCRIBE sessions;

-- New columns:
teacher_present        | TINYINT(1)    | NO  | NULL
student_present        | TINYINT(1)    | NO  | NULL
teacher_started_at     | TIMESTAMP     | YES | NULL
teacher_ended_at       | TIMESTAMP     | YES | NULL

-- Already exists:
started_at             | TIMESTAMP     | YES | NULL
ended_at               | TIMESTAMP     | YES | NULL
attendance_status      | VARCHAR(20)   | YES | NULL
status                 | VARCHAR(20)   | NO  | 'waiting'
```

---

## 🔍 Debugging Commands

### Check if teacher joined
```php
$session->teacher_present // true or false
```

### Check if student joined
```php
$session->student_present // true or false
```

### Determine attendance
```php
SessionAttendanceService::determineAttendanceStatus($session);
// Returns: 'attended' | 'absent' | 'teacher_absent'
```

### Check balance impact
```php
SessionAttendanceService::calculateBalanceImpact($session);
// Returns: ['deduct_from_student' => bool, 'reason' => string]
```

### Manually run auto-expiry
```bash
php artisan tinker
SessionAttendanceService::handleAutoExpiry()
```

---

## ⚠️ Important Notes

1. **Migration is SAFE** — only adds columns, doesn't modify existing data
2. **No data loss** — existing sessions continue to work
3. **Backward compatible** — old code still works until new code is active
4. **Scheduler** — must be running for auto-expiry to work
   - Check: `php artisan schedule:list`
   - Run locally: `php artisan schedule:work`

---

## 📞 Troubleshooting

### Problem: Scheduler not running
```bash
# Check if it's running
php artisan schedule:list

# Run scheduler (locally for testing)
php artisan schedule:work

# In production, add to crontab:
* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
```

### Problem: Balance not deducted
```bash
# Check logs
tail -f storage/logs/laravel.log | grep "balance deducted"

# Manually verify
$session->attendance_status // should be 'absent'
$balanceImpact = SessionAttendanceService::calculateBalanceImpact($session);
$balanceImpact['deduct_from_student'] // should be true
```

### Problem: Auto-expiry not working
```bash
# Check if scheduler running
ps aux | grep schedule

# Check database
SELECT * FROM sessions WHERE status='active' AND started_at < NOW() - INTERVAL 1 HOUR;

# Manually trigger
SessionAttendanceService::handleAutoExpiry()
```

---

## ✨ Summary

| Step | Action | Time | Status |
|------|--------|------|--------|
| 1 | Create migration | 10 min | - |
| 2 | Create service | 15 min | - |
| 3 | Update controller | 20 min | - |
| 4 | Add scheduler | 10 min | - |
| 5 | Test scenarios | 20 min | - |
| **Total** | | **75 min** | **Ready** |

---

**Ready to implement!** Start with Step 1 → Migration 🚀
