<?php

namespace App\Http\Requests\Api\V1\Crm;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'package_id'        => ['required', 'integer', 'exists:packages,id'],
            'amount_paid'       => ['required', 'numeric', 'min:0'],
            'payment_method'    => ['required', 'string', 'in:cash,efawateer,card,bank_transfer'],
            'payment_reference' => ['required', 'string', 'max:100'],
            'payment_screenshot'=> ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'], // 5 MB
        ];
    }
}
