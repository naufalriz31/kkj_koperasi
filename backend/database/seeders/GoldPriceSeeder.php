<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\GoldPrice; // Pastikan model ini sudah dibuat

class GoldPriceSeeder extends Seeder
{
    public function run(): void
    {
        GoldPrice::create([
            'buy_price' => 1200000,
            'sell_price' => 1100000,
        ]);
    }
}