# 🔌 API Reference

## 📋 API Overview

ZawgyiAI provides a comprehensive RESTful API for managing platforms, capabilities, and communications. All endpoints are secured with enterprise-grade security measures and include comprehensive error handling.

## 🔐 Authentication

### **API Key Authentication**
```http
Authorization: Bearer YOUR_API_KEY
```

### **CSRF Protection**
```http
X-CSRF-Token: YOUR_CSRF_TOKEN
```

## 🏥 Health Endpoints

### **GET /health**
System health check endpoint.

**Response:**
```json
{
  "status": "Zawgyi AI is running",
  "timestamp": "2024-02-04T00:00:00.000Z",
  "framework": "Zawgyi AI Framework v1.0.0"
}
```

### **GET /status**
Detailed system status endpoint.

**Response:**
```json
{
  "success": true,
  "status": "Zawgyi AI is running",
  "core": {
    "capabilities": 33,
    "platforms": 8
  },
  "gateway": {
    "platforms": 8,
    "messageHistory": 150
  },
  "uptime": 3600,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 🌐 Platform Endpoints

### **GET /api/platforms**
List all available platforms.

**Response:**
```json
{
  "success": true,
  "platforms": [
    {
      "name": "telegram",
      "status": "active",
      "capabilities": ["messaging", "commands"]
    },
    {
      "name": "whatsapp",
      "status": "active",
      "capabilities": ["messaging", "media"]
    }
  ],
  "count": 8,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **GET /api/platforms/:name/status**
Get status of a specific platform.

**Parameters:**
- `name` (string): Platform name

**Response:**
```json
{
  "success": true,
  "platform": "telegram",
  "status": "active",
  "client": "connected",
  "lastActivity": "2024-02-04T00:00:00.000Z",
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **POST /api/platforms/:name/send**
Send a message through a specific platform.

**Parameters:**
- `name` (string): Platform name

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Hello from ZawgyiAI!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_1234567890",
  "status": "sent",
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 🧩 Capability Endpoints

### **GET /api/capabilities**
List all available capabilities.

**Response:**
```json
{
  "success": true,
  "capabilities": [
    {
      "name": "surveillance",
      "description": "Camera monitoring and analysis",
      "status": "active"
    },
    {
      "name": "knowledge",
      "description": "AI chat and responses",
      "status": "active"
    }
  ],
  "count": 33,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **GET /api/capabilities/:name/status**
Get status of a specific capability.

**Parameters:**
- `name` (string): Capability name

**Response:**
```json
{
  "success": true,
  "capability": "surveillance",
  "status": "active",
  "lastUsed": "2024-02-04T00:00:00.000Z",
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **POST /api/capabilities/:name/execute`
Execute a specific capability.

**Parameters:**
- `name` (string): Capability name

**Request Body:**
```json
{
  "action": "take_screenshot",
  "parameters": {
    "quality": "high",
    "format": "png"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "file": "screenshot_1234567890.png",
    "path": "/data/surveillance/screenshot_1234567890.png",
    "size": 1024000
  },
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 📱 WhatsApp Endpoints

### **GET /api/whatsapp/status**
Get WhatsApp platform status.

**Response:**
```json
{
  "success": true,
  "status": "WhatsApp is connected",
  "client": "ready",
  "mode": "mock",
  "contacts": 2,
  "chats": 2,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **POST /api/whatsapp/send**
Send a WhatsApp message.

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Hello from WhatsApp!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "whatsapp_msg_1234567890",
  "status": "sent",
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **GET /api/whatsapp/contacts**
Get WhatsApp contacts.

**Response:**
```json
{
  "success": true,
  "contacts": [
    {
      "id": "mock-contact-1",
      "name": "Mock Contact 1",
      "number": "+1234567890",
      "profilePicUrl": "https://example.com/pic.jpg"
    }
  ],
  "count": 2,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **GET /api/whatsapp/chats**
Get WhatsApp chats.

**Response:**
```json
{
  "success": true,
  "chats": [
    {
      "id": "mock-chat-1",
      "name": "Mock Contact 1",
      "isGroup": false,
      "unreadCount": 2,
      "lastMessage": {
        "body": "Hello from mock WhatsApp",
        "timestamp": "2024-02-04T00:00:00.000Z"
      }
    }
  ],
  "count": 2,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 📨 Message Endpoints

### **GET /api/messages**
Get message history.

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "platform": "telegram",
      "sender": "User",
      "message": "Hello!",
      "type": "incoming",
      "timestamp": "2024-02-04T00:00:00.000Z"
    }
  ],
  "count": 150,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **POST /api/messages/send**
Send a message through all platforms.

**Request Body:**
```json
{
  "message": "Hello from ZawgyiAI!",
  "platforms": ["telegram", "whatsapp"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "platform": "telegram",
      "success": true,
      "messageId": "telegram_msg_1234567890"
    },
    {
      "platform": "whatsapp",
      "success": true,
      "messageId": "whatsapp_msg_1234567890"
    }
  ],
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 🔍 Search Endpoints

### **GET /api/search/messages**
Search messages.

**Parameters:**
- `query` (string): Search query
- `platform` (string, optional): Platform filter
- `limit` (number, optional): Result limit (default: 50)

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "platform": "telegram",
      "sender": "User",
      "message": "Hello!",
      "timestamp": "2024-02-04T00:00:00.000Z",
      "relevance": 0.95
    }
  ],
  "count": 1,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 📊 Analytics Endpoints

### **GET /api/analytics/overview**
Get system analytics overview.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalMessages": 1500,
    "activePlatforms": 8,
    "activeCapabilities": 33,
    "uptime": 86400,
    "errorRate": 0.01,
    "responseTime": 85
  },
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **GET /api/analytics/platforms/:name**
Get platform-specific analytics.

**Parameters:**
- `name` (string): Platform name

**Response:**
```json
{
  "success": true,
  "platform": "telegram",
  "analytics": {
    "messages": 500,
    "activeUsers": 25,
    "responseTime": 80,
    "errorRate": 0.005
  },
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 🛡️ Security Endpoints

### **GET /api/security/status**
Get security status.

**Response:**
```json
{
  "success": true,
  "security": {
    "authentication": "active",
    "rateLimiting": "active",
    "csrfProtection": "active",
    "inputValidation": "active",
    "auditLogging": "active"
  },
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **POST /api/security/audit-log**
Get audit log entries.

**Request Body:**
```json
{
  "limit": 100,
  "level": "warning"
}
```

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "timestamp": "2024-02-04T00:00:00.000Z",
      "level": "warning",
      "message": "Suspicious activity detected",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "count": 1,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 🔄 Webhook Endpoints

### **POST /api/webhooks/:platform**
Handle webhook callbacks from platforms.

**Parameters:**
- `platform` (string): Platform name

**Request Body:**
```json
{
  "event": "message",
  "data": {
    "from": "user123",
    "message": "Hello!",
    "timestamp": "2024-02-04T00:00:00.000Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "processed": true,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## ⚙️ Configuration Endpoints

### **GET /api/config/system**
Get system configuration.

**Response:**
```json
{
  "success": true,
  "config": {
    "version": "1.1.1",
    "environment": "production",
    "maxConnections": 1000,
    "timeout": 30000,
    "security": {
      "rateLimiting": true,
      "csrfProtection": true,
      "inputValidation": true
    }
  },
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **PUT /api/config/system**
Update system configuration.

**Request Body:**
```json
{
  "maxConnections": 1500,
  "timeout": 45000,
  "security": {
    "rateLimiting": true,
    "csrfProtection": true,
    "inputValidation": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "updated": true,
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

## 🚨 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-02-04T00:00:00.000Z"
}
```

### **Common Error Codes**
- `400` - Bad Request (Invalid parameters)
- `401` - Unauthorized (Invalid API key)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Internal Server Error (System error)

## 📝 Rate Limiting

### **Rate Limits**
- **Global**: 100 requests per 15 minutes
- **API Endpoints**: 10 requests per 15 minutes
- **Health Endpoints**: No rate limiting

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔍 Request Validation

### **Input Validation**
- **JSON Schema**: All request bodies validated
- **Type Checking**: Parameter type validation
- **Size Limits**: Request size limitations
- **Sanitization**: Input sanitization

### **Security Headers**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## 🎯 Usage Examples

### **Send Message to Multiple Platforms**
```bash
curl -X POST http://localhost:3006/api/messages/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from ZawgyiAI!",
    "platforms": ["telegram", "whatsapp"]
  }'
```

### **Get System Status**
```bash
curl -X GET http://localhost:3006/status \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### **Execute Capability**
```bash
curl -X POST http://localhost:3006/api/capabilities/surveillance/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "take_screenshot",
    "parameters": {
      "quality": "high",
      "format": "png"
    }
  }'
```

---

## 📞 Support

For API support and questions:
- **Documentation**: Complete API reference
- **Examples**: Usage examples and tutorials
- **Troubleshooting**: Common issues and solutions
- **Community**: Developer community support

**Start building with ZawgyiAI API today!**
