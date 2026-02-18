<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_catalog', function (Blueprint $blueprint) {
            // Menambahkan kolom kategori (defaultnya kita set ke 'kredit')
            // Kita gunakan string agar fleksibel jika nanti ada kategori lain
            $blueprint->string('category')->default('kredit')->after('name'); 
        });
    }

    public function down(): void
    {
        Schema::table('credit_catalog', function (Blueprint $blueprint) {
            $blueprint->dropColumn('category');
        });
    }
};