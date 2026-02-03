# 🔧 Troubleshooting Guide

## 📋 Troubleshooting Overview

This guide provides comprehensive solutions for common issues that may arise when using ZawgyiAI. Issues are categorized by type and include step-by-step resolution procedures.

## 🚀 Quick Diagnostics

### **System Health Check**
```bash
# Check system status
curl http://localhost:3006/status

# Check health endpoint
curl http://localhost:3006/health

# Check security status
curl http://localhost:3006/api/security/status

# Check platform status
curl http://localhost:3006/api/platforms
```

### **Log Analysis**
```bash
# View application logs
tail -f /var/log/zawgyiai/app.log

# View error logs
tail -f /var/log/zawgyiai/error.log

# View PM2 logs
pm2 logs zawgyiai

# View Docker logs
docker-compose logs -f app
```

---

## 🚨 Server Issues

### **Server Won't Start**

#### **Problem**
```bash
npm start
# Server fails to start
```

#### **Solutions**

**1. Check Port Availability**
```bash
# Check if port is in use
netstat -tulpn | grep :3005

# Kill process using port
sudo kill -9 $(lsof -ti:3005)

# Or use different port
PORT=3006 npm start
```

**2. Check Dependencies**
```bash
# Verify Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**3. Check Environment Variables**
```bash
# Verify .env file exists
ls -la .env

# Check required variables
cat .env | grep -E "(NODE_ENV|PORT|MONGODB_URI)"
```

**4. Check File Permissions**
```bash
# Fix file permissions
chmod +x src/index.js
chown -R $USER:$USER .
```

### **Server Crashes**

#### **Problem**
```bash
# Server crashes with error
Error: listen EADDRINUSE: address already in use :::3005
```

#### **Solutions**

**1. Port Conflict Resolution**
```bash
# Find process using port
sudo lsof -i :3005

# Kill the process
sudo kill -9 $(sudo lsof -t -i:3005)

# Restart server
npm start
```

**2. Memory Issues**
```bash
# Check memory usage
free -h
top

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
npm start
```

**3. Database Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test MongoDB connection
mongo --eval "db.adminCommand('ismaster')"
```

---

## 🌐 Platform Issues

### **Telegram Bot Not Working**

#### **Problem**
```bash
# Telegram bot not responding
curl http://localhost:3006/api/platforms/telegram/status
# Returns: status: "failed"
```

#### **Solutions**

**1. Verify Bot Token**
```bash
# Check .env file
grep TELEGRAM_BOT_TOKEN .env

# Test bot token
curl -X POST "https://api.telegram.org/bot<TOKEN>/getMe"
```

**2. Check Webhook Configuration**
```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/webhooks/telegram"
```

**3. Check Bot Permissions**
```bash
# Test bot permissions
curl -X POST "https://api.telegram.org/bot<TOKEN>/getChatMemberCount?chat_id=@your_bot"
```

### **WhatsApp Integration Issues**

#### **Problem**
```bash
# WhatsApp not connecting
curl http://localhost:3006/api/whatsapp/status
# Returns: status: "disconnected"
```

#### **Solutions**

**1. Browser Conflicts**
```bash
# Clear browser cache
rm -rf ./data/whatsapp-*

# Restart server
pm2 restart zawgyiai
```

**2. Network Issues**
```bash
# Check internet connectivity
ping web.whatsapp.com

# Check DNS resolution
nslookup web.whatsapp.com
```

**3. Session Issues**
```bash
# Clear WhatsApp session
rm -rf ./data/whatsapp-v7/session-*

# Re-authenticate
npm restart
```

### **Other Platform Issues**

#### **Line Integration**
```bash
# Check Line credentials
grep LINE_CHANNEL_ACCESS_TOKEN .env

# Test Line API
curl -X POST "https://api.line.me/v2/bot/message/reply" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"replyToken":"token","messages":[{"type":"text","text":"Test"}]}'
```

#### **Discord Integration**
```bash
# Check Discord token
grep DISCORD_BOT_TOKEN .env

# Test Discord bot
curl -X GET "https://discord.com/api/v10/users/@me" \
  -H "Authorization: Bot <TOKEN>"
```

---

## 🧩 Capability Issues

### **Capability Not Working**

#### **Problem**
```bash
# Capability not responding
curl -X POST http://localhost:3006/api/capabilities/surveillance/execute \
  -H "Content-Type: application/json" \
  -d '{"action": "take_screenshot"}'
# Returns: error: "Capability not available"
```

#### **Solutions**

**1. Check Capability Status**
```bash
# List all capabilities
curl http://localhost:3006/api/capabilities

# Check specific capability
curl http://localhost:3006/api/capabilities/surveillance/status
```

**2. Enable Capability**
```bash
# Enable capability
curl -X POST http://localhost:3006/api/capabilities/surveillance/enable
```

**3. Check Dependencies**
```bash
# Check required dependencies
npm list | grep surveillance

# Install missing dependencies
npm install
```

### **Surveillance Camera Issues**

#### **Problem**
```bash
# Camera not working
curl -X POST http://localhost:3006/api/capabilities/surveillance/execute \
  -H "Content-Type: application/json" \
  -d '{"action": "take_screenshot"}'
# Returns: error: "Camera not found"
```

#### **Solutions**

**1. Check Camera Hardware**
```bash
# List available cameras
ls /dev/video*

# Test camera
ffmpeg -f v4l2 -i /dev/video0 -vframes 1 test.jpg
```

**2. Check Camera Permissions**
```bash
# Add user to video group
sudo usermod -a -G video $USER

# Reboot to apply changes
sudo reboot
```

**3. Check Camera Configuration**
```bash
# Check camera config
cat ./data/surveillance/camera-config.json

# Update camera config
nano ./data/surveillance/camera-config.json
```

---

## 🛡️ Security Issues

### **Authentication Issues**

#### **Problem**
```bash
# Authentication failing
curl -X GET http://localhost:3006/api/capabilities \
  -H "Authorization: Bearer invalid-token"
# Returns: 401 Unauthorized
```

#### **Solutions**

**1. Check API Key**
```bash
# Verify API key format
echo $API_KEY | wc -c

# Generate new API key
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

**2. Check Token Expiration**
```bash
# Decode JWT token
node -e "
const jwt = require('jsonwebtoken');
const token = 'your-token';
try {
  const decoded = jwt.decode(token);
  console.log('Token expires:', new Date(decoded.exp * 1000));
} catch (e) {
  console.log('Invalid token');
}
"
```

**3. Check Environment Variables**
```bash
# Check JWT secret
grep JWT_SECRET .env

# Verify secret format
echo $JWT_SECRET | wc -c
```

### **Rate Limiting Issues**

#### **Problem**
```bash
# Rate limiting blocking requests
for i in {1..110}; do curl http://localhost:3006/api/capabilities; done
# Returns: 429 Too Many Requests
```

#### **Solutions**

**1. Check Rate Limit Configuration**
```bash
# Check rate limit settings
grep RATE_LIMIT .env

# Adjust rate limits
export RATE_LIMIT_MAX_REQUESTS=200
```

**2. Clear Rate Limit Cache**
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Restart server
pm2 restart zawgyiai
```

**3. Whitelist IP**
```bash
# Add IP to whitelist
export RATE_LIMIT_WHITELIST=127.0.0.1
```

---

## 📊 Performance Issues

### **Slow Response Times**

#### **Problem**
```bash
# Slow API responses
time curl http://localhost:3006/api/capabilities
# Returns: real 0m2.345s
```

#### **Solutions**

**1. Check Database Performance**
```bash
# Check MongoDB performance
mongo --eval "db.runCommand({serverStatus: 1})"

# Check Redis performance
redis-cli info stats
```

**2. Optimize Database Queries**
```bash
# Enable query logging
export DEBUG=mongo:query

# Add database indexes
mongo zawgyiai --eval "db.collection.createIndex({field: 1})"
```

**3. Enable Caching**
```bash
# Check Redis cache
redis-cli keys "*"
redis-cli get "cache:key"
```

### **Memory Issues**

#### **Problem**
```bash
# High memory usage
top
# Shows: zawgyiai process using 80% RAM
```

#### **Solutions**

**1. Check Memory Leaks**
```bash
# Check memory usage
node --inspect src/index.js

# Monitor with PM2
pm2 monit
```

**2. Optimize Memory Usage**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable garbage collection
export NODE_OPTIONS="--expose-gc"
```

**3. Scale Horizontally**
```bash
# Add more instances
pm2 scale zawgyiai 4
```

---

## 🔧 Configuration Issues

### **Environment Variable Issues**

#### **Problem**
```bash
# Environment variables not loading
echo $NODE_ENV
# Returns: undefined
```

#### **Solutions**

**1. Check .env File**
```bash
# Verify .env file exists
ls -la .env

# Check file permissions
ls -la .env | grep .env
```

**2. Load Environment Variables**
```bash
# Load .env file
source .env

# Or use dotenv
npm install dotenv
```

**3. Verify Variable Names**
```bash
# Check variable names
grep -n "NODE_ENV" .env

# Check for typos
cat .env | tr '[:upper:]' '[:lower:]' | grep node_env
```

### **Database Connection Issues**

#### **Problem**
```bash
# Database connection failing
Error: MongooseServerSelectionError: Could not connect to MongoDB
```

#### **Solutions**

**1. Check MongoDB Service**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**2. Verify Connection String**
```bash
# Test MongoDB connection
mongo $MONGODB_URI --eval "db.adminCommand('ismaster')"
```

**3. Check Network Connectivity**
```bash
# Test network connectivity
telnet localhost 27017

# Check firewall
sudo ufw status
```

---

## 📱 Client-Side Issues

### **Web Interface Not Loading**

#### **Problem**
```bash
# Web interface shows blank page
curl http://localhost:3006/
# Returns: 200 OK but no content
```

#### **Solutions**

**1. Check Static Files**
```bash
# Check public directory
ls -la public/

# Check file permissions
ls -la public/index.html
```

**2. Check Nginx Configuration**
```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**3. Check Browser Console**
```javascript
// Check for JavaScript errors
console.error('Error details');

// Check network requests
fetch('/api/capabilities')
  .then(response => response.json())
  .catch(error => console.error(error));
```

### **API Request Issues**

#### **Problem**
```bash
# API requests failing
curl -X POST http://localhost:3006/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
# Returns: 400 Bad Request
```

#### **Solutions**

**1. Check Request Format**
```bash
# Validate JSON
echo '{"message": "test"}' | jq .

# Check content type
curl -X POST http://localhost:3006/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' -v
```

**2. Check API Endpoints**
```bash
# List available endpoints
curl http://localhost:3006/api/capabilities

# Check endpoint documentation
curl http://localhost:3006/docs/api-reference
```

**3. Check Authentication**
```bash
# Check API key
curl -X GET http://localhost:3006/api/capabilities \
  -H "Authorization: Bearer $API_KEY"
```

---

## 🔍 Debugging Tools

### **Built-in Debugging**
```bash
# Enable debug mode
DEBUG=zawgyiai:* npm start

# Check application logs
pm2 logs zawgyiai

# Monitor performance
pm2 monit
```

### **External Tools**
```bash
# Network debugging
netstat -tulpn | grep :3005
ss -tulpn | grep :3005

# Process debugging
ps aux | grep node
top -p $(pgrep node)

# Memory debugging
node --inspect src/index.js
```

### **Database Debugging**
```bash
# MongoDB debugging
mongo --eval "db.stats()"
mongo --eval "db.getCollectionNames()"

# Redis debugging
redis-cli monitor
redis-cli info memory
```

---

## 📞 Support Resources

### **Getting Help**
- **Documentation**: Complete documentation
- **Community**: Developer community
- **Issues**: GitHub issues
- **Email**: support@zawgyiai.com

### **Reporting Issues**
When reporting issues, include:
- **System Information**: OS, Node.js version, browser
- **Error Messages**: Complete error messages
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected vs Actual**: What you expected vs. what happened
- **Logs**: Relevant log entries

### **Common Debugging Commands**
```bash
# System information
uname -a
node --version
npm --version

# Application status
pm2 status
pm2 info

# Network status
ping google.com
nslookup google.com

# File permissions
ls -la
chmod +x script.sh
```

---

## 🎯 Prevention Tips

### **Regular Maintenance**
- Update dependencies regularly
- Monitor system resources
- Backup configuration files
- Test security features
- Review logs periodically

### **Best Practices**
- Use version control
- Implement proper error handling
- Log important events
- Monitor performance metrics
- Test before deployment

### **Security Practices**
- Keep secrets secure
- Use HTTPS everywhere
- Implement rate limiting
- Validate all inputs
- Monitor for threats

---

**Troubleshoot ZawgyiAI issues effectively with our comprehensive guide!**
