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
            // Leads are assigned to an ACTIVE CC only. (Paid students go to LP
            // through PaidStudentController::assign, which keeps their status.)
            'user_id' => ['required', 'integer',
                Rule::exists('users', 'id')->where('role', 'cc')->whereNull('deleted_at')],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.exists' => 'يمكن تعيين الليدة لموظف CC فعّال فقط.',
        ];
    }
}
