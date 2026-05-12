<?php

namespace App\Http\Requests\Api\V1\Crm;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:100'],
            'phone'       => ['required', 'string', 'max:20', 'unique:leads,phone'],
            'source'      => ['nullable', 'string', 'max:50'],
            'age'         => ['nullable', 'integer', 'min:5', 'max:100'],
            // Admin only: optionally assign to a CC upon creation
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'assigned_to.exists' => 'The selected staff member does not exist.',
        ];
    }
}
