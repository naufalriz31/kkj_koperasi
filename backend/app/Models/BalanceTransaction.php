<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BalanceTransaction extends Model
{
    protected $fillable = ['user_id', 'type', 'amount', 'status'];
    //
}
