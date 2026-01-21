# TransRentals Admin Panel Setup Guide

## Overview

The TransRentals Admin Panel is a comprehensive CMS (Content Management System) that allows you to manage:

- **Pages**: Create and manage custom pages with SEO optimization
- **Blog**: Write and publish blog posts with categories and tags
- **SEO**: Manage meta tags, OG tags, and SEO settings
- **Redirects**: Handle 301/302 URL redirects
- **Media**: Upload and manage images and files
- **Settings**: Configure site-wide settings

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

## Database Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**Mac (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE transrentals_cms;

# Create user (optional)
CREATE USER transrentals WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE transrentals_cms TO transrentals;

# Exit
\q
```

### 3. Configure Database URL

Update the `.env` file with your database connection string:

```env
DATABASE_URL="postgresql://transrentals:your_password@localhost:5432/transrentals_cms?schema=public"
```

Or use the default PostgreSQL user:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/transrentals_cms?schema=public"
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This will:
- Create all database tables
- Set up relationships
- Initialize the schema

### 4. Seed the Database

```bash
npm run db:seed
```

This creates:
- Default admin user
- Sample blog category
- Default settings

**Default Admin Credentials:**
- Email: `admin@transrentals.in`
- Password: `admin123`

⚠️ **Important:** Change the default password after first login!

### 5. Update NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Update `.env.local`:

```env
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Running the Admin Panel

### Development Mode

```bash
npm run dev
```

Access the admin panel at: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Production Build

```bash
npm run build
npm start
```

## Admin Panel Features

### 1. Dashboard
- Overview statistics
- Quick actions
- Recent activity

### 2. Pages Management
- Create custom pages
- Rich text editor
- SEO metadata per page
- Draft/Published status
- Slug management

### 3. Blog Management
- Create blog posts
- Rich text editor with formatting
- Categories and tags
- Featured images
- View counter
- Reading time estimation
- Draft/Published/Scheduled status

### 4. SEO Management
- Meta titles and descriptions
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Noindex/Nofollow options
- Per-page SEO overrides

### 5. Redirects Management
- 301 (Permanent) redirects
- 302 (Temporary) redirects
- Hit counter for analytics
- Active/Inactive status
- Bulk management

### 6. Media Library
- Image uploads
- File management
- Thumbnail generation
- Alt text and captions
- Folder organization
- File size tracking

### 7. Settings
- Site information
- Contact details
- Social media links
- SEO defaults
- Email configuration

## Database Commands

### View Database with Prisma Studio
```bash
npm run db:studio
```

Opens a visual database editor at [http://localhost:5555](http://localhost:5555)

### Push Schema Changes (without migrations)
```bash
npm run db:push
```

### Create Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

## User Roles

The system supports three admin roles:

1. **SUPER_ADMIN**: Full access to all features
2. **ADMIN**: Access to content management
3. **EDITOR**: Limited to creating and editing content

## Security Best Practices

1. **Change Default Password**: Immediately after first login
2. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, symbols
3. **Keep NextAuth Secret Secure**: Never commit to version control
4. **Update Dependencies**: Regularly run `npm update`
5. **Enable HTTPS**: In production environments
6. **Restrict Admin Access**: Use IP whitelisting if possible
7. **Regular Backups**: Backup your database regularly

## Troubleshooting

### Database Connection Errors

**Error**: `Can't reach database server`

**Solution**:
1. Ensure PostgreSQL is running: `brew services list` (Mac) or `systemctl status postgresql` (Linux)
2. Check DATABASE_URL in `.env`
3. Verify database exists: `psql -l`

### Prisma Client Errors

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npx prisma generate
npm run dev
```

### NextAuth Errors

**Error**: `Missing secret`

**Solution**:
Add NEXTAUTH_SECRET to `.env.local`

### Migration Errors

**Error**: `Migration failed`

**Solution**:
```bash
npx prisma migrate reset
npm run db:migrate
npm run db:seed
```

## API Routes

The admin panel uses these API routes:

- `POST /api/auth/[...nextauth]` - Authentication
- `GET/POST/PUT/DELETE /api/admin/pages` - Pages CRUD
- `GET/POST/PUT/DELETE /api/admin/blog` - Blog CRUD
- `GET/POST/PUT/DELETE /api/admin/redirects` - Redirects CRUD
- `POST /api/admin/media` - File uploads
- `GET/PUT /api/admin/settings` - Settings management

## Creating Additional Admin Users

Use Prisma Studio or create via API:

```typescript
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

const hashedPassword = await bcrypt.hash('password', 10);

await prisma.adminUser.create({
  data: {
    email: 'editor@transrentals.in',
    password: hashedPassword,
    name: 'Editor User',
    role: 'EDITOR',
    isActive: true,
  },
});
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://your-domain.com
```

### Database Migration

```bash
npx prisma migrate deploy
```

### Build

```bash
npm run build
```

## Support

For issues or questions:
- Check the troubleshooting section
- Review Prisma documentation: [prisma.io/docs](https://www.prisma.io/docs)
- Review NextAuth documentation: [next-auth.js.org](https://next-auth.js.org)

## License

Proprietary - TransRentals © 2024
