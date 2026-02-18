<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'status',
        'member_id',
        'tapro_balance',
        'avatar_url',
        'pin', // [PENTING] Pastikan ini ada agar bisa diupdate
        
        // Saldo Simpanan Lain
        'simpok_balance',
        'simwa_balance',
        'simade_balance',
        'sipena_balance',
        'sihara_balance',
        'siqurma_balance',
        'siuji_balance',
        'siwalima_balance',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
        // 'pin',  <-- [PERBAIKAN UTAMA] HAPUS ATAU KOMENTARI BARIS INI
        // Jika 'pin' ada di sini, Frontend tidak akan pernah tahu kalau user sudah punya PIN.
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            // 'pin' => 'hashed', <-- JANGAN DI-HASH DULU (Agar sesuai dengan data '111111' di database Anda)
            
            // Casting saldo ke integer agar aman
            'tapro_balance'    => 'integer',
            'simpok_balance'   => 'integer',
            'simwa_balance'    => 'integer',
            'simade_balance'   => 'integer',
            'sipena_balance'   => 'integer',
            'sihara_balance'   => 'integer',
            'siqurma_balance'  => 'integer',
            'siuji_balance'    => 'integer',
            'siwalima_balance' => 'integer',
        ];
    }
}