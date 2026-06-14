<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    // ─── Role Constants ───────────────────────────────────────────────────────
    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_CC          = 'cc';   // Sales Staff — Lead & Subscription management
    const ROLE_SS          = 'ss';   // Student Support — Progress tracking
    const ROLE_TEACHER     = 'teacher';
    const ROLE_STUDENT     = 'student';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'role',
        'timezone',
        'fcm_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /**
     * Always store phone numbers in canonical E.164 so the SAME human number
     * never produces duplicate user rows (Firebase sends +962…, secret-login
     * sends 07…, the CRM sometimes uses Arabic-Indic digits ٠٧…).
     */
    public function setPhoneAttribute($value): void
    {
        $this->attributes['phone'] = $value === null
            ? null
            : \App\Support\Phone::normalizeOrRaw($value);
    }

    // ─── Role Helpers ─────────────────────────────────────────────────────────

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isCC(): bool
    {
        return $this->role === self::ROLE_CC;
    }

    public function isSS(): bool
    {
        return $this->role === self::ROLE_SS;
    }

    public function isTeacher(): bool
    {
        return $this->role === self::ROLE_TEACHER;
    }

    public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

    // Super admin or SS can view student progress
    public function canViewStudentProgress(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_SS]);
    }

    // Roles allowed inside the CRM web app
    public function isCrmUser(): bool
    {
        return in_array($this->role, [
            self::ROLE_SUPER_ADMIN,
            self::ROLE_CC,
            self::ROLE_SS,
        ]);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    // Leads this CC staff member is assigned to
    public function assignedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'assigned_to');
    }

    // Subscriptions activated by this user (CC staff)
    public function activatedSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'activated_by');
    }

    // Subscriptions approved by this user (super_admin)
    public function approvedSubscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'approved_by');
    }

    // ─── Teacher Relationships ─────────────────────────────────────────────────

    /** Sessions taught by this teacher */
    public function taughtSessions(): HasMany
    {
        return $this->hasMany(Session::class, 'teacher_id');
    }

    // ─── Student Relationships ─────────────────────────────────────────────────

    /** Sessions this student is enrolled in */
    public function studentSessions(): HasMany
    {
        return $this->hasMany(Session::class, 'student_id');
    }

    /** Units this student has purchased */
    public function enrolledUnits(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Unit::class, 'student_units', 'student_id', 'unit_id')
            ->withPivot(['status', 'enrolled_at', 'completed_at', 'expires_at'])
            ->withTimestamps();
    }
}
