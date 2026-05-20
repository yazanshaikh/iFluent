<?php

namespace App\Http\Requests\Api\V1\Crm;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'months_count' => ['required', 'integer', 'min:1', 'max:24'],
            'amount_paid'  => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'months_count.required' => 'يجب تحديد عدد الشهور.',
            'months_count.min'      => 'الحد الأدنى شهر واحد.',
            'months_count.max'      => 'الحد الأقصى 24 شهراً.',
            'amount_paid.required'  => 'يجب إدخال المبلغ الفعلي.',
            'amount_paid.min'       => 'المبلغ لا يمكن أن يكون سالباً.',
        ];
    }
}
