# GitHub Secrets Setup Guide

## Why This is Needed

To generate ALL airport transfer and one-way cab pages at build time, GitHub Actions needs access to your production database during the build process. This allows it to:
1. Fetch all routes from `chauffeur_route_packages` table
2. Generate static pages for each route (2000+ pages)
3. Create SEO-optimized URLs for every route

## Security Considerations

**Option 1: Use Read-Only Database User (RECOMMENDED)**
- Create a separate MySQL user with only SELECT permission
- Safest approach - can't modify data even if credentials leak
- Best practice for CI/CD environments

**Option 2: Use Main Database URL**
- Simpler setup but higher risk
- GitHub Secrets are encrypted but still a security consideration

## Step-by-Step Setup

### Step 1: Create Read-Only Database User (Recommended)

Connect to your MySQL database and run:

```sql
-- Create read-only user for CI/CD
CREATE USER 'github_readonly'@'%' IDENTIFIED BY 'secure_password_here';

-- Grant only SELECT permission
GRANT SELECT ON your_database_name.* TO 'github_readonly'@'%';

-- Apply changes
FLUSH PRIVILEGES;
```

Your read-only DATABASE_URL will be:
```
mysql://github_readonly:secure_password_here@your-db-host:3306/your_database_name
```

### Step 2: Add Secrets to GitHub Repository

1. Go to your GitHub repository: `https://github.com/saurav1702/tran_stable`

2. Click **Settings** → **Secrets and variables** → **Actions**

3. Click **New repository secret** and add each of these:

   | Secret Name | Value | Required? |
   |-------------|-------|-----------|
   | `PRODUCTION_DATABASE_URL` | `mysql://github_readonly:password@host:3306/db` | ✅ YES |
   | `NEXTAUTH_SECRET` | Your NextAuth secret (from production .env) | ✅ YES |
   | `NEXTAUTH_URL` | Your production URL (e.g., `https://transrentals.com`) | ✅ YES |
   | `NEXT_PUBLIC_APP_URL` | Same as NEXTAUTH_URL | ✅ YES |

### Step 3: Test the Setup

1. Commit and push your changes to a branch
2. Create a pull request or push to `main` branch
3. Go to **Actions** tab on GitHub
4. Watch the "Build Application" step
5. Check the logs - you should see:
   ```
   [airport-transfer] Generating ALL 2000+ airport route pages at build time
   ```

### Step 4: Verify Pages are Generated

After successful build, the `.next/server/app/(services)/airport-transfer/[slug]` directory should contain thousands of pre-rendered HTML files.

## Troubleshooting

### Build fails with "Access denied for user"
- Check your DATABASE_URL format is correct
- Verify the user has SELECT permission: `SHOW GRANTS FOR 'github_readonly'@'%';`
- Make sure your database host allows connections from GitHub Actions IPs

### Build times out (>10 minutes)
- This is normal! Generating 2000+ pages takes time
- Expected build time: 20-45 minutes depending on route count
- Consider using incremental builds in future

### No pages generated despite successful build
- Check `SKIP_DATABASE_CALLS` is set to `"0"` in ci.yml
- Verify routes exist in database with `isActive = true`
- Check build logs for error messages

## Alternative: JSON Export (No Database Access)

If you can't provide database access to GitHub:

1. Export routes to JSON file:
   ```bash
   npm run export-routes
   ```

2. Commit the JSON file to repository

3. Update `generateStaticParams()` to read from JSON instead of database

This approach requires manual export before each build but doesn't need database credentials in GitHub.

## Current Configuration

Your CI workflow now uses this fallback pattern:
```yaml
DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL || 'mysql://root:test_password@127.0.0.1:3306/test_db' }}
```

This means:
- ✅ If `PRODUCTION_DATABASE_URL` is set → uses production database (generates all real pages)
- ⚠️ If not set → uses test database (generates only test routes, no real pages)

## Next Steps

1. Set up the GitHub Secrets (Step 2 above)
2. Push this branch to GitHub
3. Monitor the build process
4. Verify pages are generated
5. Apply same pattern to one-way-cab routes
6. Future: Apply to round-trip routes
