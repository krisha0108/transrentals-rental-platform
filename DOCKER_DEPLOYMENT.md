# 🐳 Docker Deployment Guide - TransRentals

## ✨ Features

This Docker setup includes:
- ✅ **Auto Prisma Setup**: Automatically runs `prisma generate` and `prisma migrate deploy`
- ✅ **Database Wait**: Waits for database to be ready before starting
- ✅ **Auto Seeding**: Optional database seeding with `SEED_DATABASE=true`
- ✅ **Multi-stage Build**: Optimized image size
- ✅ **Health Checks**: Built-in container health monitoring
- ✅ **Production Ready**: All dependencies and configs included

---

## 🚀 Quick Start

### 1. Build Docker Image

```bash
docker build -t transrentals:latest .
```

### 2. Run with Docker

```bash
docker run -d \
  --name transrentals \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:3306/database" \
  -e NEXTAUTH_SECRET="your-super-secret-key-min-32-chars" \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  transrentals:latest
```

---

## 🐳 Docker Compose (Recommended)

### Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: transrentals-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
      MYSQL_DATABASE: transrentals
      MYSQL_USER: transrentals_user
      MYSQL_PASSWORD: your_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # TransRentals Application
  app:
    build: .
    container_name: transrentals-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Database
      DATABASE_URL: "mysql://transrentals_user:your_password@mysql:3306/transrentals"

      # NextAuth
      NEXTAUTH_URL: "https://yourdomain.com"
      NEXTAUTH_SECRET: "your-super-secret-key-min-32-chars-change-this"

      # Optional: Seed database on first run
      SEED_DATABASE: "false"

      # App Config
      NEXT_PUBLIC_APP_NAME: "TransRentals"
      NEXT_PUBLIC_APP_URL: "https://yourdomain.com"
      NEXT_PUBLIC_CONTACT_EMAIL: "info@yourdomain.com"
      NEXT_PUBLIC_CONTACT_PHONE: "+91-XXXXXXXXXX"

    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  mysql_data:
```

### Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (CAUTION: Deletes database!)
docker-compose down -v
```

---

## 🔧 Environment Variables

### Required Variables

```env
DATABASE_URL=mysql://user:password@host:3306/database
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
NEXTAUTH_URL=https://yourdomain.com
```

### Optional Variables

```env
# Seed database on startup
SEED_DATABASE=true

# Public variables (for build-time, set as build-args)
NEXT_PUBLIC_APP_NAME=TransRentals
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_CONTACT_EMAIL=info@transrentals.com
NEXT_PUBLIC_CONTACT_PHONE=+91-XXXXXXXXXX
```

---

## 📋 What Happens on Container Start?

The Docker entrypoint script automatically:

1. ⏳ **Waits for Database** - Checks if MySQL is ready (max 60 seconds)
2. 📦 **Generates Prisma Client** - Runs `npx prisma generate`
3. 🗄️ **Runs Migrations** - Executes `npx prisma migrate deploy`
4. 🌱 **Seeds Database** (optional) - If `SEED_DATABASE=true`
5. 🚀 **Starts Application** - Runs Next.js server on port 3000

---

## 🔍 Troubleshooting

### Check Container Logs

```bash
docker logs transrentals-app -f
```

### Connect to Container

```bash
docker exec -it transrentals-app sh
```

### Run Prisma Commands Manually

```bash
# Inside container
docker exec -it transrentals-app npx prisma generate
docker exec -it transrentals-app npx prisma migrate deploy
docker exec -it transrentals-app npx prisma db seed
```

### Database Connection Issues

```bash
# Test database connectivity
docker exec -it transrentals-app nc -zv mysql 3306

# Check environment variables
docker exec -it transrentals-app printenv | grep DATABASE
```

---

## 🚀 Production Deployment

### Option 1: Docker Hub

```bash
# Tag image
docker tag transrentals:latest yourusername/transrentals:latest

# Push to Docker Hub
docker push yourusername/transrentals:latest

# Pull and run on production server
docker pull yourusername/transrentals:latest
docker run -d --name transrentals -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="..." \
  yourusername/transrentals:latest
```

### Option 2: Private Registry

```bash
# Tag for private registry
docker tag transrentals:latest registry.yourdomain.com/transrentals:latest

# Push
docker push registry.yourdomain.com/transrentals:latest
```

### Option 3: Direct Deployment

```bash
# Save image as tar
docker save transrentals:latest | gzip > transrentals.tar.gz

# Transfer to server
scp transrentals.tar.gz user@server:/path/

# Load on server
docker load < transrentals.tar.gz
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint

The container includes a health check at `/api/health` (if configured).

### Docker Health Status

```bash
# Check container health
docker ps

# View health check logs
docker inspect transrentals-app | grep -A 10 Health
```

---

## 🔄 Updates & Migrations

### Update to New Version

```bash
# Pull latest code
git pull origin main

# Rebuild image
docker build -t transrentals:latest .

# Stop old container
docker stop transrentals-app
docker rm transrentals-app

# Start new container (migrations run automatically)
docker run -d --name transrentals-app ... transrentals:latest
```

### With Docker Compose

```bash
# Rebuild and restart
docker-compose up -d --build

# Migrations run automatically on startup!
```

---

## 🎯 Complete Production Example

```bash
# 1. Clone repository
git clone https://github.com/your-repo/tran_stable.git
cd tran_stable

# 2. Create .env file
cat > .env << 'EOF'
DATABASE_URL=mysql://root:password@mysql:3306/transrentals
NEXTAUTH_SECRET=change-this-to-a-random-32-char-string
NEXTAUTH_URL=https://yourdomain.com
SEED_DATABASE=false
EOF

# 3. Start with Docker Compose
docker-compose up -d

# 4. Check logs
docker-compose logs -f app

# 5. Access application
# Open browser to http://localhost:3000
```

---

## ⚡ Quick Commands

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f app

# Restart
docker-compose restart app

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build

# Run migrations manually
docker exec -it transrentals-app npx prisma migrate deploy

# Seed database
docker exec -it transrentals-app npm run seed
```

---

## 🎉 Done!

Your TransRentals application is now running in Docker with:
- ✅ Automatic Prisma setup
- ✅ Auto migrations on startup
- ✅ Database health checks
- ✅ Production-ready configuration

**No manual Prisma commands needed!** Everything is automated! 🚀
