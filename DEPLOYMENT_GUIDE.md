# RDA Ice Tube System - Production Deployment Guide

## 🚀 Hostinger Deployment Instructions

### Pre-Deployment Checklist ✅

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the following values in `.env`:
     ```env
     APP_NAME="RDA Ice Tube System"
     APP_ENV=production
     APP_DEBUG=false
     APP_URL=https://yourdomain.com
     
     DB_CONNECTION=mysql
     DB_HOST=localhost
     DB_PORT=3306
     DB_DATABASE=your_database_name
     DB_USERNAME=your_database_user
     DB_PASSWORD=your_database_password
     ```

2. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   php artisan migrate --force
   
   # Seed database with admin user
   php artisan db:seed --force
   ```

4. **Optimize for Production**
   ```bash
   # Clear and cache configuration
   php artisan config:cache
   
   # Clear and cache routes
   php artisan route:cache
   
   # Clear and cache views
   php artisan view:cache
   
   # Install and build frontend assets
   npm install --production
   npm run build
   ```

5. **Set Permissions**
   ```bash
   chmod -R 755 storage/
   chmod -R 755 bootstrap/cache/
   ```

### Default Admin Credentials 🔐

After deployment, you can login with:
- **Username:** `jericho`
- **Email:** `jericho@rdaicesystem.com`
- **Password:** `password`

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

### File Structure for Upload 📁

Upload these directories to your Hostinger public_html:
```
app/
bootstrap/
config/
database/
public/          <- Point domain to this folder
resources/
routes/
storage/
vendor/
.env            <- Configure this file
artisan
composer.json
package.json
```

### Domain Configuration 🌐

In Hostinger control panel:
1. Point your domain's document root to the `public` folder
2. Ensure PHP version is 8.1 or higher
3. Enable required PHP extensions: mbstring, openssl, pdo, tokenizer, xml, ctype, json

### Security Notes 🔒

1. Never expose the `.env` file publicly
2. Ensure `storage/` and `bootstrap/cache/` are writable
3. Set appropriate file permissions (755 for directories, 644 for files)
4. Enable HTTPS/SSL certificate

### Troubleshooting 🛠️

If you encounter issues:
1. Check error logs in `storage/logs/`
2. Verify all environment variables are correct
3. Ensure database credentials are valid
4. Check file permissions
5. Clear all caches: `php artisan optimize:clear`

### Clean Features ✨

This deployment includes:
- ✅ Clean migrations (removed duplicates)
- ✅ Removed all debug/test files
- ✅ Production-ready environment configuration
- ✅ Admin user seeder
- ✅ Optimized build configuration
- ✅ Enhanced component architecture
- ✅ Equipment management system
- ✅ Employee management with validation
- ✅ Order management system
- ✅ Inventory tracking
- ✅ Responsive design for mobile/desktop

---

**Need help?** Contact the development team for assistance.