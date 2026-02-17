<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InflipProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'location',
        'target_amount',
        'collected_amount',
        'min_investment',
        'roi_percent',
        'duration_months',
        'image_url',
        'status',
    ];

    // 1. Daftarkan nama atribut baru di sini agar muncul saat data diubah ke JSON (API)
    protected $appends = ['funding_progress'];

    /**
     * 2. Logika perhitungan progress (Accessor)
     * Format penamaan fungsi wajib: get[NamaAtribut]Attribute
     */
    public function getFundingProgressAttribute()
    {
        if ($this->target_amount <= 0) {
            return 0;
        }

        // Menghitung persentase dana terkumpul
        $progress = ($this->collected_amount / $this->target_amount) * 100;
        
        // Membatasi maksimal 100% dan membulatkan 2 angka di belakang koma
        return round(min(100, $progress), 2);
    }

    /**
     * Relasi ke Investasi
     */
    public function investments()
    {
        return $this->hasMany(InflipInvestment::class, 'project_id');
    }
}