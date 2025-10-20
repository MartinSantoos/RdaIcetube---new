<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CheckAdminUsers extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'user:check-admins';

    /**
     * The console command description.
     */
    protected $description = 'Check all admin users in the system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('👑 Admin Users in the System:');
        $this->info('================================');

        $admins = User::where('user_type', 1)->get(['id', 'name', 'username', 'email', 'status']);

        if ($admins->isEmpty()) {
            $this->warn('❌ No admin users found!');
            return 0;
        }

        foreach ($admins as $admin) {
            $this->line("✅ ID: {$admin->id}");
            $this->line("   Name: {$admin->name}");
            $this->line("   Username: {$admin->username}");
            $this->line("   Email: {$admin->email}");
            $this->line("   Status: " . ($admin->status ?? 'active'));
            $this->line("");
        }

        $this->info("📊 Total Admin Users: " . $admins->count());
        
        return 0;
    }
}
