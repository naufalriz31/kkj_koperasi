<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditCatalog extends Model
{
    use HasFactory;

    // Nama tabel di database
    protected $table = 'credit_catalog';

    // Kolom yang boleh diisi (Mass Assignable)
    protected $fillable = [
        'name',
        'price',
        'dp',
        'tax',
        'tenors'
    ];

    /**
     * Fitur Casting Laravel
     * Mengubah string JSON di kolom 'tenors' menjadi Array PHP secara otomatis
     */
    protected $casts = [
        'tenors' => 'array',
        'price'  => 'integer',
        'dp'     => 'integer',
        'tax'    => 'integer',
    ];
}