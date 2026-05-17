<?php

namespace App\Http\Requests\Api\V1\Crm;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignLeadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // The staff member to assign to — must be CC or SS
            'user_id' => ['required', 'integer',
                Rule::exists('users', 'id')->whereIn('role', ['cc', 'ss'])],
        ];
    }
}
