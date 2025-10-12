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
            // Add username column
            $table->string('username')->unique()->after('id');
            
            // Add user_type column with default value and comment
            $table->integer('user_type')->default(1)->comment('1 = Admin, 2 = Employee')->after('password');
            
            // Make email nullable since we'll use username for login
            $table->string('email')->nullable()->change();
            
            // Rename id to user_id if needed (optional, keeping Laravel standard)
            // $table->renameColumn('id', 'user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'user_type']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
