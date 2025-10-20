<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:clear {--confirm : Skip confirmation prompt}';

    /**
     * The console command description.
     */
    protected $description = 'Clear all data from the database for deployment preparation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('confirm')) {
            $confirmed = $this->confirm('⚠️  This will permanently delete ALL data from your database. Are you sure?');
            
            if (!$confirmed) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $this->info('🗑️  Starting database cleanup...');

        try {
            // Disable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            $tables = [
                'activity_logs',
                'maintenances', 
                'orders',
                'inventory',
                'equipment',
                'users',
                'jobs',
                'job_batches',
                'failed_jobs',
                'cache',
                'cache_locks',
                'sessions',
                'password_reset_tokens',
            ];

            $clearedTables = 0;

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    $rowCount = DB::table($table)->count();
                    
                    if ($rowCount > 0) {
                        DB::table($table)->truncate();
                        $this->line("✅ Cleared {$table} ({$rowCount} rows)");
                        $clearedTables++;
                    } else {
                        $this->line("ℹ️  Table {$table} was already empty");
                    }
                } else {
                    $this->line("⚠️  Table {$table} does not exist");
                }
            }

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            $this->info("\n🎉 Database cleanup completed!");
            $this->info("📊 Summary: {$clearedTables} tables cleared");
            $this->info("🚀 Your database is now ready for deployment to Hostinger!");

        } catch (\Exception $e) {
            $this->error("❌ Error clearing database: " . $e->getMessage());
            
            // Re-enable foreign key checks in case of error
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            return 1;
        }

        return 0;
    }
}