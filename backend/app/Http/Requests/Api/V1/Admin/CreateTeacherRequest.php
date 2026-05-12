<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CreateTeacherRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:100'],
            'email'           => ['required', 'email', 'unique:users,email'],
            'password'        => ['required', 'string', 'min:8'],
            'bio'             => ['nullable', 'string', 'max:500'],
            'specialization'  => ['nullable', 'string', 'max:100'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:999'],
        ];
    }
}
