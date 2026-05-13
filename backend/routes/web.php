<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
use App\Models\User;
use Illuminate\Support\Facades\Hash;

Route::get('/final-fix', function () {
    $user = User::updateOrCreate(
        ['email' => 'SYazanadmin@ifluent.jo'],
        [
            'name'     => 'Admin iFluent',
            'password' => Hash::make('Yazan@1!2@#3'), // هذا هو المفتاح الجديد
            'role'     => 'super_admin'
        ]
    );
    return "تم التحديث! البريد: SYazanadmin@ifluent.jo | الباسورد: Yazan@1!2@#3";
});