<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->boolean('recurring_maintenance')->default(false)->after('broken_reason');
            $table->string('maintenance_type')->nullable()->after('recurring_maintenance');
            $table->integer('maintenance_frequency_minutes')->nullable()->after('maintenance_type');
            $table->date('maintenance_end_date')->nullable()->after('maintenance_frequency_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('equipment', function (Blueprint $table) {
            $table->dropColumn([
                'recurring_maintenance',
                'maintenance_type', 
                'maintenance_frequency_minutes',
                'maintenance_end_date'
            ]);
        });
    }
};