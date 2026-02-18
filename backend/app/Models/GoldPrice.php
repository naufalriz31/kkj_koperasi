<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoldPrice extends Model
{
    use HasFactory;

    // Menentukan nama tabel secara manual (sesuai dengan migrasi)
    protected $table = 'gold_prices';

    // Kolom yang diizinkan untuk diisi secara massal (Mass Assignment)
    // Ini harus sama dengan kolom yang dipanggil di GoldPriceSeeder
    protected $fillable = [
        'buy_price',
        'sell_price',
    ];

    /**
     * Cast kolom ke tipe data tertentu (Opsional)
     * Memastikan harga selalu dibaca sebagai integer/angka
     */
    protected $casts = [
        'buy_price' => 'integer',
        'sell_price' => 'integer',
    ];
}