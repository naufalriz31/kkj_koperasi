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
       Schema::create('lhu_distributions', function (Blueprint $table) {
    $table->id();
    $table->string('period_year');
    $table->decimal('total_amount', 15, 2);
    $table->enum('status', ['draft', 'executed'])->default('draft');
    $table->timestamps();
});

Schema::create('lhu_member_details', function (Blueprint $table) {
    $table->id();
    $table->foreignId('lhu_distribution_id')->constrained()->onDelete('cascade');
    $table->foreignId('user_id')->constrained();
    $table->decimal('amount_received', 15, 2);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lhu_tables');
    }
};
