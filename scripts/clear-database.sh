#!/bin/bash

echo "🗑️  RDA Ice System - Database Cleanup Script for Hostinger Deployment"
echo "=================================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if php artisan is available
if ! command_exists php; then
    echo "❌ PHP is not available in PATH"
    exit 1
fi

echo "📋 Pre-deployment Database Cleanup Checklist:"
echo "1. Clear all existing data"
echo "2. Reset auto-increment counters"
echo "3. Optimize database tables"
echo "4. Create fresh admin user (optional)"
echo ""

read -p "⚠️  This will permanently delete ALL data. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting database cleanup..."

# Method 1: Using the custom artisan command
echo "📝 Method 1: Using custom artisan command..."
php artisan db:clear --confirm

# Method 2: Using migration (alternative)
echo ""
echo "📝 Method 2: Running cleanup migration..."
php artisan migrate --path=database/migrations/2025_10_20_000000_clear_all_database_data.php --force

# Method 3: Optimize database
echo ""
echo "🔧 Optimizing database..."
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "✅ Database cleanup completed!"
echo ""
echo "📋 Next steps for Hostinger deployment:"
echo "1. Update .env file with Hostinger database credentials"
echo "2. Run: php artisan migrate --force"
echo "3. Run: php artisan db:seed (if you have seeders)"
echo "4. Create your admin user account"
echo ""
echo "🎉 Your application is ready for deployment!"