<?php

namespace App\Http\Requests\Api\V1\Crm;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'lessons_count'   => ['required', 'integer', 'min:1', 'max:252'],
            'amount_paid'     => ['required', 'numeric', 'min:0'],
            'from_lesson_id'  => ['nullable', 'integer', 'exists:lessons,id'],
            'to_lesson_id'    => ['nullable', 'integer', 'exists:lessons,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'lessons_count.required' => 'يجب تحديد عدد الدروس.',
            'lessons_count.min'      => 'الحد الأدنى درس واحد.',
            'lessons_count.max'      => 'الحد الأقصى 252 درساً.',
            'amount_paid.required'   => 'يجب إدخال المبلغ الفعلي.',
            'amount_paid.min'        => 'المبلغ لا يمكن أن يكون سالباً.',
        ];
    }
}
