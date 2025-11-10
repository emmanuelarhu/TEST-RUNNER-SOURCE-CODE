# Test Runner Platform - Deployment Guide

## 🚀 Deployment Options

### 1. Local Development
Already covered in QUICKSTART.md

### 2. Production Deployment

## Docker Deployment (Recommended)

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Playwright to use installed chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright
RUN npx playwright install --with-deps chromium

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "dist/server.js"]
```

### Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: test_runner_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: test_runner_db
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker Compose
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## AWS Deployment

### Option 1: AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p node.js test-runner-platform

# Create environment
eb create test-runner-env

# Deploy
eb deploy

# View logs
eb logs
```

### Option 2: AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger (for Playwright)
   - Security group: Allow ports 22, 5000

2. **Connect and Setup**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone your-repo-url
cd test-runner-platform/backend

# Install dependencies
npm install

# Build
npm run build

# Setup PostgreSQL
sudo -u postgres psql
CREATE DATABASE test_runner_db;
CREATE USER testrunner WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE test_runner_db TO testrunner;
\q

# Configure environment
cp .env.example .env
nano .env  # Edit with your settings

# Start with PM2
pm2 start dist/server.js --name test-runner
pm2 save
pm2 startup
```

3. **Setup Nginx Reverse Proxy**
```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/test-runner
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/test-runner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: AWS RDS + Elastic Beanstalk
- Use RDS for PostgreSQL (better managed)
- Deploy backend on Elastic Beanstalk
- Configure environment variables in EB console

## Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create test-runner-platform

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add jontewks/puppeteer

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build command: `npm run build`
3. Configure run command: `node dist/server.js`
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

## Environment Variables for Production

```env
NODE_ENV=production
PORT=5000

# Database (use connection string for managed databases)
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=test_runner_db
DB_USER=your_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
JWT_EXPIRE=24h

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info

# Playwright
PLAYWRIGHT_TIMEOUT=60000
MAX_CONCURRENT_TESTS=3
```

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL/HTTPS enabled
- [ ] CORS configured for frontend domain
- [ ] Monitoring setup (e.g., PM2, CloudWatch)
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Security groups/firewall configured
- [ ] Domain/DNS configured
- [ ] Health checks working
- [ ] Test API endpoints
- [ ] WebSocket connections working

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 list
pm2 logs test-runner --lines 100
```

### AWS CloudWatch
- Set up log groups
- Create alarms for errors
- Monitor resource usage

### Health Check Endpoint
```bash
curl https://your-domain.com/health
```

## Backup Strategy

### Database Backups
```bash
# Automated daily backup
0 2 * * * pg_dump -U postgres test_runner_db > backup_$(date +\%Y\%m\%d).sql
```

### Uploads Backup
```bash
# Sync to S3
aws s3 sync /app/uploads s3://your-bucket/uploads/
```

## Scaling Considerations

1. **Horizontal Scaling**
   - Use load balancer
   - Multiple backend instances
   - Shared PostgreSQL database
   - Shared file storage (S3)

2. **Vertical Scaling**
   - Increase instance size
   - More CPU for parallel tests
   - More RAM for browser instances

3. **Database Scaling**
   - Read replicas for reports
   - Connection pooling
   - Optimize queries with indexes

## Security Best Practices

- Use environment variables, never commit secrets
- Enable SSL/TLS
- Keep dependencies updated
- Implement rate limiting
- Use security headers
- Regular security audits
- Backup encryption
- Access logs monitoring

## Troubleshooting

### Playwright Issues on Server
```bash
# Install dependencies
npx playwright install-deps
npx playwright install
```

### Database Connection Issues
```bash
# Test connection
psql -h localhost -U postgres -d test_runner_db

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

### Port Already in Use
```bash
# Find process
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)
```

## Cost Optimization

### AWS
- Use t3.medium for development
- t3.large for production
- RDS db.t3.micro for dev
- RDS db.t3.small for production
- Use Reserved Instances for 40% savings

### Estimated Monthly Costs
- **Basic**: $30-50 (EC2 t3.medium + RDS t3.micro)
- **Production**: $100-150 (EC2 t3.large + RDS t3.small)
- **High-Scale**: $500+ (Multiple instances + larger database)

---

**Questions?** Refer to AWS/Heroku/DigitalOcean documentation or reach out!