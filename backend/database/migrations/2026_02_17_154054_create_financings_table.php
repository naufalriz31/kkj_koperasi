<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // PERBAIKAN: Sebutkan nama tabel 'credit_catalog' secara eksplisit
            $table->foreignId('credit_catalog_id')
                  ->nullable()
                  ->constrained('credit_catalog') // Pastikan ini sesuai nama tabel di database
                  ->nullOnDelete();
                  
            $table->string('type'); // 'cash' atau 'goods'
            $table->decimal('amount', 15, 2);
            $table->integer('duration_months');
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'active', 'paid_off'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financings');
    }
};