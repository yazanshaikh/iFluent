<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class NotebookEntry extends Model
{
    use SoftDeletes;

    protected $fillable = ['student_id', 'title', 'content', 'category', 'lesson_id', 'is_pinned'];

    protected $casts = ['is_pinned' => 'boolean'];

    public function student(): BelongsTo { return $this->belongsTo(User::class, 'student_id'); }
    public function lesson(): BelongsTo  { return $this->belongsTo(Lesson::class); }

    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }
}
