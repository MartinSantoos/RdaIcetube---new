@echo off
echo 🚀 RDA Ice System - Production Setup Script
echo ==========================================
echo.

echo 📋 Setting up production environment...
echo.

echo 🗄️  Running database migrations...
php artisan migrate --force

echo 👤 Creating admin user...
php artisan db:seed --class=AdminUserSeeder

echo 🔗 Creating storage symlink...
php artisan storage:link

echo ⚡ Optimizing for production...
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo.
echo ✅ Production setup completed!
echo.
echo 📊 Admin Login Credentials:
echo    Username: jericho
echo    Password: password
echo    Email: jericho@rdaicesystem.com
echo.
echo ⚠️  IMPORTANT: Change the admin password after first login!
echo.
echo 🌐 Your RDA Ice System is ready for production!
echo.
pause