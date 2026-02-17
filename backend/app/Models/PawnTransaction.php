<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PawnTransaction extends Model
{
    protected $fillable = ['user_id', 'item_name', 'loan_amount', 'status'];
    //
}
