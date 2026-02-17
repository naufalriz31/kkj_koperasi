<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat Akun Admin
        User::create([
            'name' => 'Administrator KKJ',
            'email' => 'admin@kkj.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
            'tapro_balance' => 0
        ]);

        // 2. Buat Akun Anggota Contoh
        User::create([
            'name' => 'Naufal Anggota',
            'email' => 'naufal@example.com',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
            'tapro_balance' => 500000 // Beri saldo awal untuk tes
        ]);
    }
}