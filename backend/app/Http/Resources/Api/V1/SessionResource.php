<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id'                => $this->id,
            'status'            => $this->status,
            'attendance_status' => $this->attendance_status,
            'scheduled_at'      => $this->scheduled_at?->toIso8601String(),
            'started_at'        => $this->started_at?->toIso8601String(),
            'ended_at'                  => $this->ended_at?->toIso8601String(),
            'evaluation_submitted_at'   => $this->evaluation_submitted_at?->toIso8601String(),

            // Daily.co room — only when session is active or for teacher
            'daily_room_url' => $this->when(
                $this->isActive() || ($user && $user->isTeacher()),
                $this->daily_room_url
            ),

            // Nearpod PIN — visible to teacher when set (waiting or active)
            'nearpod_pin' => $this->when(
                !empty($this->nearpod_pin) && ($user && ($user->isTeacher() || $user->isSuperAdmin()) || $this->isActive()),
                $this->nearpod_pin
            ),

            // Lesson details (with nearpod_url for teacher/admin)
            'lesson'  => new LessonResource($this->whenLoaded('lesson')),
            'teacher' => $this->whenLoaded('teacher', fn() => [
                'id'   => $this->teacher->id,
                'name' => $this->teacher->name,
            ]),
            'student' => $this->whenLoaded('student', function () {
                $age = null;
                $profile = \App\Models\Student::where('user_id', $this->student->id)
                    ->with('lead:id,age')->first();
                $age = $profile?->lead?->age;
                return [
                    'id'   => $this->student->id,
                    'name' => $this->student->name,
                    'age'  => $age,
                ];
            }),
        ];
    }
}
