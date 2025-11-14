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
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['completed_by']);
            $table->dropColumn('completed_by');
            $table->string('completed_by', 255)->nullable()->after('delivery_rider_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('completed_by');
            $table->unsignedBigInteger('completed_by')->nullable()->after('delivery_rider_id');
            $table->foreign('completed_by')->references('id')->on('users')->onDelete('set null');
        });
    }
};
