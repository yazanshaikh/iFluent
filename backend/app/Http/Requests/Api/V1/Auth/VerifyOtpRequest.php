<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'max:20'],
            'code'  => ['required', 'string', 'size:6'],
            // Optional: first-time registration fields
            'name'  => ['sometimes', 'string', 'max:100'],
            'age'   => ['sometimes', 'integer', 'min:5', 'max:100'],
        ];
    }
}
