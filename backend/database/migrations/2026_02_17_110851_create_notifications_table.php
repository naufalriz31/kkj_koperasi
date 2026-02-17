<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            // Menghubungkan notifikasi ke ID User di tabel users
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->string('title'); // Judul notifikasi (misal: "Top Up Berhasil")
            $table->text('message'); // Isi pesan detail
            $table->boolean('is_read')->default(false); // Status apakah sudah diklik user
            
            $table->timestamps(); // create_at & updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};