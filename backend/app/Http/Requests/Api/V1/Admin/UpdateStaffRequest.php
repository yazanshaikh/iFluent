<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'            => ['sometimes', 'string', 'max:100'],
            'email'           => ['sometimes', 'email',
                Rule::unique('users', 'email')->ignore($this->route('id'))],
            'password'        => ['sometimes', 'string', 'min:8'],
            // Role can be switched between cc ↔ ss only (not to teacher/admin)
            'role'            => ['sometimes', Rule::in(['cc', 'ss'])],
            // Teacher-specific
            'bio'             => ['sometimes', 'nullable', 'string', 'max:500'],
            'specialization'  => ['sometimes', 'nullable', 'string', 'max:100'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:999'],
        ];
    }
}
