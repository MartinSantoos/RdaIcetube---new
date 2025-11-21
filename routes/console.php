<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Register recurring maintenance command
Artisan::command('maintenance:process', function () {
    $command = new \App\Console\Commands\ProcessRecurringMaintenance();
    $command->handle();
})->purpose('Process recurring maintenance schedules');
