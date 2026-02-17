<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InflipInvestment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'project_id',
        'amount',
        'status',
    ];

    /**
     * Relasi ke User: Investasi ini milik siapa?
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke Proyek: Investasi ini masuk ke proyek mana?
     */
    public function project()
    {
        return $this->belongsTo(InflipProject::class, 'project_id');
    }
}