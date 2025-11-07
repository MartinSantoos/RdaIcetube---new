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
        Schema::table('maintenances', function (Blueprint $table) {
            // Add equipment snapshot fields to preserve historical equipment state
            $table->string('equipment_status_at_maintenance')->nullable()->after('status');
            $table->text('equipment_broken_reason_at_maintenance')->nullable()->after('equipment_status_at_maintenance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('maintenances', function (Blueprint $table) {
            $table->dropColumn(['equipment_status_at_maintenance', 'equipment_broken_reason_at_maintenance']);
        });
    }
};
