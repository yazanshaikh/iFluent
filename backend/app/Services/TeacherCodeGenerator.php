<?php

namespace App\Services;

use App\Models\Teacher;

class TeacherCodeGenerator
{
    /**
     * Generates a unique teacher code: TCH-XXXX
     * e.g., TCH-0001, TCH-0042, TCH-0100
     *
     * Students use this code to book private sessions with a specific teacher.
     */
    public function generate(): string
    {
        do {
            $last = Teacher::max('id') ?? 0;
            $code = 'TCH-' . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
        } while (Teacher::where('teacher_code', $code)->exists());

        return $code;
    }
}
