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
        Schema::create('kabar_kkj', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->string('slug')->unique(); // Untuk URL ramah SEO
    $table->text('content');
    $table->string('image_url')->nullable();
    $table->string('category')->default('umum'); // Berita, Pengumuman, Promo
    $table->boolean('is_active')->default(true);
    $table->foreignId('author_id')->constrained('users'); // Siapa admin yang posting
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kabar_kkj');
    }
};
