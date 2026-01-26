# BazarSe Seller Backend - Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Node.js 18+ installed
- [ ] Firebase project created
- [ ] Supabase project created
- [ ] Database tables created with correct schema

### 2. Credentials Configuration
- [ ] `.env` file created from `.env.example`
- [ ] `PORT` configured
- [ ] `NODE_ENV` set correctly (development/production)
- [ ] `FIREBASE_PROJECT_ID` added
- [ ] `FIREBASE_CLIENT_EMAIL` added
- [ ] `FIREBASE_PRIVATE_KEY` added with proper newlines (`\n`)
- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `CORS_ORIGIN` configured for production

### 3. Dependencies
```bash
cd backend
npm install
```

### 4. Test Locally
```bash
npm run dev
```

**Test Endpoints:**
- Health check: `GET http://localhost:3000/health`
- Should return: `{"status": "ok", "timestamp": "..."}`

### 5. Production Configuration

**Security:**
- [ ] Set `NODE_ENV=production`
- [ ] Configure specific `CORS_ORIGIN` (not wildcard)
- [ ] Use strong service role key
- [ ] Never commit `.env` file

**Optimization:**
- [ ] Enable response compression (gzip)
- [ ] Set up reverse proxy (Nginx/Apache)
- [ ] Configure rate limiting
- [ ] Enable HTTPS

## Deployment Methods

### Method 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start server
pm2 start src/server.js --name bazarse-seller-api

# Save configuration
pm2 save

# Setup auto-restart on system boot
pm2 startup

# Monitor logs
pm2 logs bazarse-seller-api

# Restart
pm2 restart bazarse-seller-api

# Stop
pm2 stop bazarse-seller-api
```

### Method 2: Systemd Service

Create `/etc/systemd/system/bazarse-seller.service`:

```ini
[Unit]
Description=BazarSe Seller Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bazarse-seller/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=bazarse-seller
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Commands:**
```bash
sudo systemctl enable bazarse-seller
sudo systemctl start bazarse-seller
sudo systemctl status bazarse-seller
sudo systemctl restart bazarse-seller
sudo journalctl -u bazarse-seller -f
```

### Method 3: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Commands:**
```bash
docker-compose up -d
docker-compose logs -f
docker-compose restart
```

## Nginx Reverse Proxy

Create `/etc/nginx/sites-available/bazarse-seller`:

```nginx
server {
    listen 80;
    server_name api.bazarse.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable:**
```bash
sudo ln -s /etc/nginx/sites-available/bazarse-seller /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**HTTPS with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.bazarse.com
```

## Monitoring & Logging

### Application Logs

**PM2:**
```bash
pm2 logs bazarse-seller-api --lines 100
pm2 logs bazarse-seller-api --err
```

**Systemd:**
```bash
sudo journalctl -u bazarse-seller -n 100 -f
```

### Health Monitoring

Set up monitoring with:
- **Uptime Kuma** (self-hosted)
- **Pingdom**
- **UptimeRobot**

Configure health check: `GET /health`

### Error Tracking

Integrate services like:
- Sentry
- Rollbar
- Bugsnag

## Database Backups

**Automated Supabase Backups:**
- Point-in-time recovery enabled
- Daily automated backups
- Download backups from Supabase dashboard

**Manual Backup:**
```bash
# Using pg_dump (if direct access available)
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

## Performance Optimization

### 1. Enable Compression

Add to `app.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Rate Limiting

```bash
npm install express-rate-limit
```

Add to `app.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Redis Cache Migration

Replace in-memory cache with Redis:

```bash
npm install redis
```

Update `utils/cache.js` to use Redis client.

## Rollback Plan

1. Keep previous version backup
2. Test new version in staging
3. Use PM2 ecosystem for easy rollback:

```bash
pm2 save
pm2 resurrect  # Restore previous state
```

## Post-Deployment Verification

- [ ] Health endpoint returns 200
- [ ] Authentication flow works
- [ ] Database connections successful
- [ ] All API endpoints responding
- [ ] Logs showing no errors
- [ ] CORS working for frontend
- [ ] HTTPS configured
- [ ] Monitoring alerts configured

## Troubleshooting

**Server not starting:**
```bash
# Check logs
pm2 logs bazarse-seller-api --err

# Verify environment
node -e "console.log(require('./src/config/env'))"
```

**Database connection issues:**
- Verify Supabase service role key
- Check network connectivity
- Review firewall rules

**High memory usage:**
- Restart PM2: `pm2 restart bazarse-seller-api`
- Check for memory leaks in cache
- Consider Redis migration

**High CPU usage:**
- Review slow database queries
- Add database indexes
- Enable query caching

## Maintenance

**Regular Tasks:**
- Weekly: Review logs for errors
- Monthly: Check dependency updates
- Quarterly: Security audit
- As needed: Database optimization

**Update Dependencies:**
```bash
npm outdated
npm update
npm audit fix
```

## Emergency Contacts

- **Backend Team Lead:** [Contact]
- **Database Admin:** [Contact]
- **DevOps:** [Contact]

## Support Links

- Firebase Console: https://console.firebase.google.com
- Supabase Dashboard: https://app.supabase.com
- PM2 Docs: https://pm2.keymetrics.io/docs
