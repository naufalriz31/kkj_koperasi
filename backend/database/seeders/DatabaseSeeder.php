<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Akun Admin (Email diganti jadi admin@gmail.com)
        User::create([
            'name' => 'Administrator KKJ',
            'email' => 'admin@gmail.com', // <-- SUDAH DIGANTI
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
            'tapro_balance' => 0,
        ]);

        // 2. Buat Akun Member Contoh (Opsional)
        User::create([
            'name' => 'Anggota Contoh',
            'email' => 'member@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
            'tapro_balance' => 500000,
        ]);
        
        // 3. Panggil Seeder Lain (Harga Emas)
        // Pastikan file GoldPriceSeeder.php sudah ada dan benar
        $this->call([
            GoldPriceSeeder::class,
        ]);
    }
}