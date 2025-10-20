#!/bin/bash

echo "🚀 RDA Ice System - Production Setup Script"
echo "=========================================="

echo ""
echo "📋 Setting up production environment..."
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Create admin user
echo "👤 Creating admin user..."
php artisan db:seed --class=AdminUserSeeder

# Create storage link
echo "🔗 Creating storage symlink..."
php artisan storage:link

# Cache configurations for production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "✅ Production setup completed!"
echo ""
echo "📊 Admin Login Credentials:"
echo "   Username: jericho"
echo "   Password: password"
echo "   Email: jericho@rdaicesystem.com"
echo ""
echo "⚠️  IMPORTANT: Change the admin password after first login!"
echo ""
echo "🌐 Your RDA Ice System is ready for production!"