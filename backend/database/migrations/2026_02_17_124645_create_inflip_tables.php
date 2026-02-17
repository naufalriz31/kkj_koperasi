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
        // 1. Tabel Proyek Properti
        Schema::create('inflip_projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location');
            $table->bigInteger('target_amount');        // Target dana yang dibutuhkan
            $table->bigInteger('collected_amount')->default(0); // Dana yang sudah terkumpul
            $table->bigInteger('min_investment');      // Minimal investasi per anggota
            $table->decimal('roi_percent', 5, 2);      // Estimasi bagi hasil (contoh: 12.50)
            $table->integer('duration_months');        // Tenor proyek dalam bulan
            $table->string('image_url')->nullable();
            $table->string('status')->default('open'); // open, closed, completed
            $table->timestamps();
        });

        // 2. Tabel Detail Investasi Anggota
        Schema::create('inflip_investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('project_id')->constrained('inflip_projects')->onDelete('cascade');
            $table->bigInteger('amount');              // Jumlah yang diinvestasikan
            $table->string('status')->default('active'); // active, completed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inflip_investments');
        Schema::dropIfExists('inflip_projects');
    }
};