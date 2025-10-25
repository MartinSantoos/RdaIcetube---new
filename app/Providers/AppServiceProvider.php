<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure default password rules
        Password::defaults(function () {
            return Password::min(3)->max(15);
        });

        // Custom blade directive for safe price formatting
        Blade::directive('safePrice', function ($expression) {
            return "<?php 
                \$value = $expression;
                if (is_null(\$value) || \$value === '' || \$value === '?') {
                    echo '0.00';
                } else {
                    echo number_format((float)\$value, 2);
                }
            ?>";
        });
    }
}
