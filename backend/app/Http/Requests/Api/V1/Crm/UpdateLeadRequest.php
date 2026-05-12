<?php

namespace App\Http\Requests\Api\V1\Crm;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'   => ['sometimes', 'string', 'max:100'],
            'phone'  => ['sometimes', 'string', 'max:20',
                Rule::unique('leads', 'phone')->ignore($this->route('lead'))],
            'source' => ['sometimes', 'nullable', 'string', 'max:50'],
            'age'    => ['sometimes', 'nullable', 'integer', 'min:5', 'max:100'],
        ];
    }
}
