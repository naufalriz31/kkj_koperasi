<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // [PENTING] Tambahkan ini untuk API Token

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // Data Dasar
        'name',
        'email',
        'password',
        'phone',
        'role',           // 'admin' atau 'member'
        'status',         // 'active', 'pending', 'rejected'
        'member_id',      // Nomor Induk Anggota (NIAK)
        'avatar_url',     // URL Foto Profil
        'pin',            // PIN Transaksi (Hashed)

        // Saldo Utama
        'tapro_balance',

        // Saldo Simpanan Lain (Sesuai tampilan Home.tsx)
        'simpok_balance',   // Simpanan Pokok
        'simwa_balance',    // Simpanan Wajib
        'simade_balance',   // Masa Depan
        'sipena_balance',   // Pendidikan
        'sihara_balance',   // Hari Raya
        'siqurma_balance',  // Qurban
        'siuji_balance',    // Haji/Umroh
        'siwalima_balance', // Walimah
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pin', // Sembunyikan PIN agar tidak terekspos di API response
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            
            // Casting saldo ke integer agar di frontend terbaca sebagai angka (bukan string)
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