# 🚀 Deployment Guide

## 📋 Deployment Overview

This guide provides comprehensive instructions for deploying ZawgyiAI in various environments, from development to production. ZawgyiAI supports multiple deployment methods including traditional server deployment, Docker containerization, and cloud platforms.

## 🚀 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/zawgyiai/zawgyiai.git
cd zawgyiai
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

### **4. Start Server**
```bash
npm start
```

---

## 🔧 Development Deployment

### **Local Development Setup**

#### **Prerequisites**
- Node.js 16+ installed
- MongoDB (optional)
- Git installed

#### **Installation**
```bash
# Clone repository
git clone https://github.com/zawgyiai/zawgyiai.git
cd zawgyiai

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### **Environment Configuration**
```bash
# Development Environment Variables
NODE_ENV=development
PORT=3005
DEBUG=zawgyiai:*

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/zawgyiai
REDIS_URL=redis://localhost:6379

# Platform Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WHATSAPP_PHONE_NUMBER=your_phone_number

# Security Configuration
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3005
```

#### **Start Development Server**
```bash
# Start with nodemon for auto-restart
npm run dev

# Or start normally
npm start
```

#### **Development Tools**
```bash
# Run tests
npm test

# Run linting
npm run lint

# Run security audit
npm audit

# Generate documentation
npm run docs
```

---

## 🏭 Production Deployment

### **Server Requirements**

#### **Minimum Requirements**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100Mbps
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

#### **Recommended Requirements**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 1Gbps
- **OS**: Ubuntu 22.04 LTS

### **Production Setup**

#### **1. Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2
```

#### **2. Application Deployment**
```bash
# Create application user
sudo useradd -m -s /bin/bash zawgyiai
sudo usermod -aG sudo zawgyiai

# Switch to application user
sudo su - zawgyiai

# Clone repository
git clone https://github.com/zawgyiai/zawgyiai.git
cd zawgyiai

# Install dependencies
npm install --production

# Create production environment file
cp .env.example .env
nano .env
```

#### **3. Production Environment Configuration**
```bash
# Production Environment Variables
NODE_ENV=production
PORT=3005

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/zawgyiai_prod
REDIS_URL=redis://localhost:6379

# Security Configuration
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=https://your-domain.com

# Platform Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WHATSAPP_PHONE_NUMBER=your_phone_number

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/zawgyiai/app.log
```

#### **4. PM2 Configuration**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'zawgyiai',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    error_file: '/var/log/zawgyiai/error.log',
    out_file: '/var/log/zawgyiai/out.log',
    log_file: '/var/log/zawgyiai/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

#### **5. Start Application**
```bash
# Create logs directory
sudo mkdir -p /var/log/zawgyiai
sudo chown zawgyiai:zawgyiai /var/log/zawgyiai

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### **Nginx Configuration**

#### **Nginx Configuration File**
```nginx
# /etc/nginx/sites-available/zawgyiai
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket Support
    location /ws {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static Files
    location / {
        root /var/www/zawgyiai/public;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:3005/health;
        access_log off;
    }
}
```

#### **Enable Site**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/zawgyiai /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🐳 Docker Deployment

### **Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

# Start application
CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
      - PORT=3005
      - MONGODB_URI=mongodb://mongo:27017/zawgyiai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3005/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    environment:
      - MONGO_INITDB_DATABASE=zawgyiai

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

### **Docker Deployment Commands**
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Stop containers
docker-compose down

# Remove volumes
docker-compose down -v
```

---

## ☁️ Cloud Deployment

### **AWS Deployment**

#### **AWS EC2 Setup**
```bash
# Create EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --user-data file://user-data.sh
```

#### **User Data Script**
```bash
#!/bin/bash
# user-data.sh

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repository
git clone https://github.com/zawgyiai/zawgyiai.git
cd zawgyiai

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### **AWS ECS Deployment**
```json
{
  "family": "zawgyiai",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "zawgyiai",
      "image": "your-account.dkr.ecr.region.amazonaws.com/zawgyiai:latest",
      "portMappings": [
        {
          "containerPort": 3005,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/zawgyiai",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### **Google Cloud Platform**

#### **Cloud Run Deployment**
```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT-ID/zawgyiai

# Deploy to Cloud Run
gcloud run deploy zawgyiai \
  --image gcr.io/PROJECT-ID/zawgyiai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production
```

### **Microsoft Azure**

#### **Azure Container Instances**
```bash
# Create resource group
az group create zawgyiai-rg eastus

# Create container instance
az container create \
  --resource-group zawgyiai-rg \
  --name zawgyiai \
  --image your-registry/zawgyiai:latest \
  --cpu 1 \
  --memory 2 \
  --ports 3005 \
  --environment-variables NODE_ENV=production
```

---

## 🔧 Environment Variables

### **Complete Environment Configuration**
```bash
# Application Configuration
NODE_ENV=production
PORT=3005
DEBUG=zawgyiai:*

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/zawgyiai_prod
REDIS_URL=redis://localhost:6379

# Security Configuration
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=https://your-domain.com

# Platform Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
WHATSAPP_PHONE_NUMBER=your_phone_number
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
LINE_CHANNEL_SECRET=your_line_secret
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
VIBER_AUTH_TOKEN=your_viber_auth_token

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=/var/log/zawgyiai/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Monitoring Configuration
METRICS_ENABLED=true
HEALTH_CHECK_ENABLED=true
PERFORMANCE_MONITORING=true

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
STRICT_RATE_LIMIT_MAX=10

# File Storage Configuration
UPLOAD_PATH=/var/www/zawgyiai/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# Notification Configuration
WEBHOOK_URL=https://your-monitoring-service.com/webhook
ADMIN_EMAIL=admin@your-domain.com
```

---

## 📊 Monitoring & Logging

### **Application Monitoring**
```javascript
// Monitoring configuration
const monitoring = {
  enabled: true,
  metrics: {
    requests: true,
    errors: true,
    performance: true,
    memory: true,
    cpu: true
  },
  alerts: {
    errorRate: 0.05,
    responseTime: 1000,
    memoryUsage: 0.8,
    cpuUsage: 0.8
  }
};
```

### **Logging Configuration**
```javascript
// Winston logging configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: '/var/log/zawgyiai/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: '/var/log/zawgyiai/combined.log',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});
```

---

## 🔧 Performance Optimization

### **Node.js Optimization**
```javascript
// Cluster mode for multi-core utilization
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require('./src/index.js');
}
```

### **Memory Optimization**
```javascript
// V8 optimization
process.env.UV_THREADPOOL_SIZE = 128;
process.env.NODE_OPTIONS = '--max-old-space-size=1024';
```

### **Database Optimization**
```javascript
// MongoDB connection pooling
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

---

## 🔒 Security Hardening

### **Security Checklist**
- [ ] Use HTTPS everywhere
- [ ] Implement proper authentication
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Implement rate limiting
- [ ] Use input validation
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Network security groups
- [ ] Firewall configuration

### **SSL/TLS Configuration**
```bash
# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📈 Scaling Strategies

### **Horizontal Scaling**
- Load balancer configuration
- Multiple application instances
- Database replication
- Caching layer
- CDN integration

### **Vertical Scaling**
- Increase CPU cores
- Increase RAM
- Faster storage
- Network optimization

---

## 🔄 Continuous Deployment

### **CI/CD Pipeline**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to production
        run: |
          docker build -t zawgyiai .
          docker push ${{ secrets.DOCKER_REGISTRY }}/zawgyiai
          kubectl apply -f k8s/
```

---

## 📞 Support

For deployment support:
- **Documentation**: Complete deployment guides
- **Examples**: Deployment examples and templates
- **Troubleshooting**: Common deployment issues
- **Community**: Deployment community support

**Deploy ZawgyiAI with confidence using our comprehensive deployment guide!**
