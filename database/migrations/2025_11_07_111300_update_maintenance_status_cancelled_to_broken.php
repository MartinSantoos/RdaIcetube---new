<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update any existing maintenance records with 'cancelled' status to 'broken'
        DB::table('maintenances')
            ->where('status', 'cancelled')
            ->update(['status' => 'broken']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert 'broken' status back to 'cancelled' if needed
        DB::table('maintenances')
            ->where('status', 'broken')
            ->update(['status' => 'cancelled']);
    }
};
