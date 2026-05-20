<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentAccountSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('payment_accounts')->count() > 0) {
            $this->command->info('Payment accounts already seeded — skipping.');
            return;
        }

        $accounts = [
            [
                'alias'      => 'iFluent26',
                'cliq_name'  => 'محفظة أمنية يو واليت',
                'sort_order' => 1,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'alias'      => 'IFLUENT3',
                'cliq_name'  => 'بنك ريفلكت',
                'sort_order' => 2,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'alias'      => 'IFLUENT',
                'cliq_name'  => 'محفظة زين كاش',
                'sort_order' => 3,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('payment_accounts')->insert($accounts);

        $this->command->info('Payment accounts seeded (3 CliQ accounts).');
    }
}
