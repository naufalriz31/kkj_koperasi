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
    Schema::table('users', function (Blueprint $table) {
        $table->string('phone')->nullable()->after('email');
        $table->string('role')->default('member')->after('phone'); // admin, member
        $table->string('status')->default('pending')->after('role'); // active, pending, rejected
        $table->string('member_id')->nullable()->after('status');
        $table->string('avatar_url')->nullable()->after('member_id');
        $table->string('pin')->nullable()->after('password');
        
        // Saldo-saldo (Default 0)
        $table->bigInteger('tapro_balance')->default(0);
        $table->bigInteger('simpok_balance')->default(0);
        $table->bigInteger('simwa_balance')->default(0);
        $table->bigInteger('simade_balance')->default(0);
        $table->bigInteger('sipena_balance')->default(0);
        $table->bigInteger('sihara_balance')->default(0);
        $table->bigInteger('siqurma_balance')->default(0);
        $table->bigInteger('siuji_balance')->default(0);
        $table->bigInteger('siwalima_balance')->default(0);
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn([
            'phone', 'role', 'status', 'member_id', 'avatar_url', 'pin',
            'tapro_balance', 'simpok_balance', 'simwa_balance', 'simade_balance',
            'sipena_balance', 'sihara_balance', 'siqurma_balance', 'siuji_balance', 'siwalima_balance'
        ]);
    });
}
};
