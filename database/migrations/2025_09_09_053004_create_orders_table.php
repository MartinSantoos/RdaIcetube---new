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
        Schema::create('orders', function (Blueprint $table) {
            $table->id('order_id');
            $table->string('customer_name');
            $table->text('address');
            $table->string('contact_number', 11);
            $table->integer('quantity');
            $table->string('size');
            $table->string('status')->default('pending');
            $table->date('order_date');
            $table->date('delivery_date');
            $table->string('delivery_mode');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
