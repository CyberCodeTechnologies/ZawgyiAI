# 👨‍💻 ZawgyiAI Developer Guide

## 🎯 Introduction

Welcome to the ZawgyiAI Developer Guide! This comprehensive guide will help you understand the architecture, contribute to the project, and build custom capabilities and integrations.

## 🏗️ Architecture Overview

### **Core Components**

#### **Zawgyi Core Framework**
```javascript
const ZawgyiCore = require('./core/zawgyi-core');

class ZawgyiCore {
    constructor() {
        this.name = "Zawgyi AI";
        this.version = "1.1.1";
        this.capabilities = new Map();
        this.context = new Map();
        this.plugins = new Map();
        this.modules = new Map();
    }
}
```

#### **Gateway System**
```javascript
const ZawgyiGateway = require('./core/zawgyi-gateway');

class ZawgyiGateway {
    constructor(core) {
        this.core = core;
        this.platforms = new Map();
        this.messageHistory = [];
    }
}
```

#### **Capability System**
```javascript
const ZawgyiCapability = require('./core/zawgyi-capability');

class ZawgyiCapability {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.actions = new Map();
        this.gateway = null;
    }
}
```

### **Directory Structure**
```
src/
├── core/                   # Core framework
│   ├── zawgyi-core.js      # Main framework class
│   ├── zawgyi-gateway.js   # Platform gateway
│   ├── zawgyi-capability.js # Capability base class
│   ├── agent.js            # Message processing agent
│   └── tools/              # Utility tools
├── capabilities/           # AI capabilities
│   ├── surveillance.js     # Camera monitoring
│   ├── knowledge.js        # AI chat system
│   ├── email.js            # Email integration
│   └── ...                 # Other capabilities
├── config/                 # Configuration files
├── services/               # External services
└── index.js               # Main application entry
```

---

## 🧩 Building Custom Capabilities

### **Capability Structure**

#### **Basic Capability Template**
```javascript
const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');

class CustomCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('custom', 'Custom capability description');
        
        this.gateway = gateway;
        this.setupActions();
    }

    setupActions() {
        // Register actions
        this.addAction('custom_action', this.customAction.bind(this), {
            description: 'Description of custom action',
            parameters: ['param1', 'param2']
        });
    }

    async customAction(params, userId) {
        try {
            // Implement your custom logic here
            console.log('Executing custom action with params:', params);
            
            // Return result
            return {
                success: true,
                message: 'Custom action completed successfully',
                data: params
            };
        } catch (error) {
            console.error('Custom action error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async execute(action, params, userId) {
        if (this.actions.has(action)) {
            return await this.actions.get(action)(params, userId);
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
    }
}

module.exports = CustomCapability;
```

### **Advanced Capability Example**

#### **Weather Capability**
```javascript
const { ZawgyiCapability } = require('../core/zawgyi-capability');
const axios = require('axios');

class WeatherCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('weather', 'Weather information and forecasts');
        
        this.gateway = gateway;
        this.apiKey = process.env.WEATHER_API_KEY;
        this.setupActions();
    }

    setupActions() {
        this.addAction('get_weather', this.getWeather.bind(this), {
            description: 'Get current weather for a location',
            parameters: ['location']
        });

        this.addAction('get_forecast', this.getForecast.bind(this), {
            description: 'Get weather forecast',
            parameters: ['location', 'days']
        });
    }

    async getWeather(params, userId) {
        try {
            const { location } = params;
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${this.apiKey}`
            );

            const weather = response.data;
            return {
                success: true,
                location: weather.name,
                temperature: weather.main.temp,
                description: weather.weather[0].description,
                humidity: weather.main.humidity,
                message: `Weather in ${weather.name}: ${weather.main.temp}°C, ${weather.weather[0].description}`
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch weather data'
            };
        }
    }

    async getForecast(params, userId) {
        try {
            const { location, days = 5 } = params;
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${this.apiKey}`
            );

            const forecast = response.data.list.slice(0, days * 8); // 8 forecasts per day
            return {
                success: true,
                location: location,
                forecast: forecast.map(item => ({
                    date: new Date(item.dt * 1000),
                    temperature: item.main.temp,
                    description: item.weather[0].description
                })),
                message: `${days}-day forecast for ${location}`
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch forecast data'
            };
        }
    }
}

module.exports = WeatherCapability;
```

---

## 🔌 Platform Integration

### **Adding New Platforms**

#### **Platform Registration**
```javascript
// In zawgyi-gateway.js
registerNewPlatform() {
    this.registerPlatform('newplatform', {
        initialize: async () => {
            console.log('📱 New platform initializing...');
            // Initialize platform client
            const client = await this.initializeNewPlatformClient();
            return client;
        }
    });
}

async initializeNewPlatformClient() {
    // Platform-specific initialization
    const client = new NewPlatformClient({
        apiKey: process.env.NEWPLATFORM_API_KEY
    });

    // Set up event handlers
    client.on('message', async (message) => {
        await this.handleNewPlatformMessage(message);
    });

    await client.connect();
    return client;
}
```

#### **Message Handling**
```javascript
async handleNewPlatformMessage(message) {
    try {
        const userId = message.senderId;
        const content = message.content;
        
        // Process message through agent
        const response = await this.agent.processMessage(userId, content, 'newplatform');
        
        // Send response
        await this.sendNewPlatformMessage(userId, response);
    } catch (error) {
        console.error('New platform message error:', error);
    }
}
```

### **Platform Configuration**

#### **Environment Variables**
```bash
# Add to .env file
NEWPLATFORM_API_KEY=your_api_key
NEWPLATFORM_WEBHOOK_URL=https://your-domain.com/webhook/newplatform
NEWPLATFORM_ENABLED=true
```

#### **Configuration File**
```javascript
// config/platforms/newplatform.config.js
module.exports = {
    enabled: process.env.NEWPLATFORM_ENABLED === 'true',
    apiKey: process.env.NEWPLATFORM_API_KEY,
    webhookUrl: process.env.NEWPLATFORM_WEBHOOK_URL,
    features: {
        messaging: true,
        media: true,
        commands: true
    },
    limits: {
        messagesPerMinute: 60,
        maxFileSize: 10485760, // 10MB
        supportedFormats: ['jpg', 'png', 'gif', 'pdf']
    }
};
```

---

## 🔧 API Development

### **REST API Endpoints**

#### **Creating New Endpoints**
```javascript
// In index.js
setupRoutes() {
    // Existing routes...
    
    // Custom capability endpoint
    this.app.post('/api/custom/execute', async (req, res) => {
        try {
            const { capability, action, parameters } = req.body;
            
            // Validate request
            if (!capability || !action) {
                return res.status(400).json({
                    success: false,
                    error: 'Capability and action are required'
                });
            }
            
            // Execute capability
            const result = await this.core.capabilityRegistry.execute(
                capability, 
                action, 
                parameters, 
                req.userId || 'anonymous'
            );
            
            res.json({
                success: true,
                result: result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
}
```

#### **API Documentation**
```javascript
/**
 * @api {post} /api/custom/execute Execute Custom Capability
 * @apiName ExecuteCustomCapability
 * @apiGroup Custom
 * @apiDescription Execute a custom capability action
 * 
 * @apiParam {String} capability Capability name
 * @apiParam {String} action Action name
 * @apiParam {Object} parameters Action parameters
 * 
 * @apiSuccess {Boolean} success Success status
 * @apiSuccess {Object} result Action result
 * @apiSuccess {String} timestamp Timestamp
 * 
 * @apiError {Boolean} success Error status
 * @apiError {String} error Error message
 * @apiError {String} timestamp Timestamp
 */
```

### **WebSocket Integration**

#### **WebSocket Setup**
```javascript
const WebSocket = require('ws');

// In index.js
setupWebSocket() {
    const wss = new WebSocket.Server({ port: 3007 });
    
    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');
        
        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'execute_capability') {
                    const result = await this.core.capabilityRegistry.execute(
                        data.capability,
                        data.action,
                        data.parameters,
                        data.userId
                    );
                    
                    ws.send(JSON.stringify({
                        type: 'capability_result',
                        success: true,
                        result: result
                    }));
                }
            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    success: false,
                    error: error.message
                }));
            }
        });
        
        ws.on('close', () => {
            console.log('WebSocket client disconnected');
        });
    });
}
```

---

## 🗄️ Database Integration

### **MongoDB Integration**

#### **Database Setup**
```javascript
const mongoose = require('mongoose');

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User schema
const userSchema = new mongoose.Schema({
    userId: String,
    platform: String,
    preferences: Object,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Message schema
const messageSchema = new mongoose.Schema({
    userId: String,
    platform: String,
    message: String,
    response: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);
```

#### **Database Operations**
```javascript
class DatabaseService {
    async saveUser(userId, platform, preferences = {}) {
        try {
            const user = await User.findOneAndUpdate(
                { userId, platform },
                { preferences, updatedAt: new Date() },
                { upsert: true, new: true }
            );
            return user;
        } catch (error) {
            console.error('Save user error:', error);
            throw error;
        }
    }

    async saveMessage(userId, platform, message, response) {
        try {
            const messageDoc = new Message({
                userId,
                platform,
                message,
                response
            });
            return await messageDoc.save();
        } catch (error) {
            console.error('Save message error:', error);
            throw error;
        }
    }

    async getUserHistory(userId, platform, limit = 50) {
        try {
            return await Message.find({ userId, platform })
                .sort({ timestamp: -1 })
                .limit(limit);
        } catch (error) {
            console.error('Get history error:', error);
            throw error;
        }
    }
}
```

---

## 🧪 Testing

### **Unit Testing**

#### **Capability Testing**
```javascript
// test/capabilities/weather.test.js
const WeatherCapability = require('../../src/capabilities/weather');
const assert = require('assert');

describe('WeatherCapability', () => {
    let weatherCapability;

    beforeEach(() => {
        weatherCapability = new WeatherCapability();
    });

    describe('getWeather', () => {
        it('should return weather data for valid location', async () => {
            const params = { location: 'London' };
            const result = await weatherCapability.getWeather(params, 'test-user');
            
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.location, 'London');
            assert(result.temperature);
            assert(result.description);
        });

        it('should handle invalid location', async () => {
            const params = { location: 'InvalidCity' };
            const result = await weatherCapability.getWeather(params, 'test-user');
            
            assert.strictEqual(result.success, false);
            assert(result.error);
        });
    });
});
```

#### **Integration Testing**
```javascript
// test/integration/platform.test.js
const ZawgyiGateway = require('../../src/core/zawgyi-gateway');
const ZawgyiCore = require('../../src/core/zawgyi-core');

describe('Platform Integration', () => {
    let core, gateway;

    beforeEach(() => {
        core = new ZawgyiCore();
        gateway = new ZawgyiGateway(core);
    });

    it('should register platform successfully', () => {
        gateway.registerPlatform('test', {
            initialize: async () => ({ status: 'active' })
        });

        assert(gateway.platforms.has('test'));
    });

    it('should process messages correctly', async () => {
        const testMessage = {
            userId: 'test-user',
            platform: 'test',
            content: 'hello'
        };

        const response = await gateway.processMessage(testMessage);
        assert(response);
    });
});
```

### **Running Tests**

#### **Test Configuration**
```json
// package.json
{
  "scripts": {
    "test": "mocha test/**/*.test.js",
    "test:watch": "mocha test/**/*.test.js --watch",
    "test:coverage": "nyc mocha test/**/*.test.js"
  },
  "devDependencies": {
    "mocha": "^10.0.0",
    "chai": "^4.3.0",
    "nyc": "^15.0.0",
    "sinon": "^15.0.0"
  }
}
```

---

## 🚀 Deployment

### **Docker Deployment**

#### **Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
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

#### **Docker Compose**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/zawgyiai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

### **Production Configuration**

#### **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
PORT=3005
MONGODB_URI=mongodb://localhost:27017/zawgyiai_prod
REDIS_URL=redis://localhost:6379

# Security
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/zawgyiai/app.log
```

#### **PM2 Configuration**
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

---

## 🔍 Debugging

### **Debug Tools**

#### **Built-in Debugging**
```javascript
// Enable debug mode
DEBUG=zawgyiai:* npm start

// Debug specific modules
DEBUG=zawgyiai:gateway,zawgyi:capabilities npm start
```

#### **Logging**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### **Common Issues**

#### **Capability Loading Issues**
```javascript
// Debug capability loading
console.log('Loading capabilities from:', capabilitiesDir);
console.log('Available files:', capabilityFiles);

// Check capability structure
capabilityFiles.forEach(file => {
    console.log(`Loading ${file}...`);
    try {
        const CapabilityClass = require(capabilityPath);
        console.log(`Capability type: ${typeof CapabilityClass}`);
        console.log(`Capability constructor: ${CapabilityClass.name}`);
    } catch (error) {
        console.error(`Failed to load ${file}:`, error);
    }
});
```

#### **Platform Connection Issues**
```javascript
// Debug platform initialization
async initializePlatform(platformName) {
    try {
        console.log(`Initializing ${platformName}...`);
        const platform = this.platforms.get(platformName);
        
        if (!platform) {
            throw new Error(`Platform ${platformName} not found`);
        }
        
        const client = await platform.initialize();
        console.log(`${platformName} initialized successfully`);
        
        return client;
    } catch (error) {
        console.error(`Failed to initialize ${platformName}:`, error);
        throw error;
    }
}
```

---

## 📈 Performance Optimization

### **Memory Management**

#### **Memory Monitoring**
```javascript
// Monitor memory usage
setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('Memory Usage:', {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
    });
}, 30000); // Every 30 seconds
```

#### **Garbage Collection**
```javascript
// Manual garbage collection
if (global.gc) {
    setInterval(() => {
        global.gc();
        console.log('Garbage collection performed');
    }, 300000); // Every 5 minutes
}
```

### **Caching**

#### **Redis Caching**
```javascript
const Redis = require('redis');
const client = Redis.createClient();

class CacheService {
    async get(key) {
        try {
            const value = await client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            await client.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async del(key) {
        try {
            await client.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }
}
```

---

## 🤝 Contributing

### **Development Workflow**

#### **1. Fork and Clone**
```bash
git clone https://github.com/your-username/zawgyiai.git
cd zawgyiai
```

#### **2. Create Feature Branch**
```bash
git checkout -b feature/new-capability
```

#### **3. Make Changes**
- Write clean, documented code
- Add tests for new features
- Update documentation
- Follow coding standards

#### **4. Test Changes**
```bash
npm test
npm run lint
```

#### **5. Submit Pull Request**
```bash
git add .
git commit -m "feat: add new capability"
git push origin feature/new-capability
```

### **Coding Standards**

#### **JavaScript Standards**
```javascript
// Use ES6+ features
const { ZawgyiCapability } = require('../core/zawgyi-capability');

// Use async/await
async customAction(params, userId) {
    try {
        const result = await this.processData(params);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Use destructuring
const { success, data, error } = result;

// Use template literals
const message = `Action completed with status: ${success ? 'success' : 'failed'}`;
```

#### **File Naming**
- Use kebab-case for files: `weather-capability.js`
- Use PascalCase for classes: `WeatherCapability`
- Use camelCase for functions: `getWeatherData`

---

## 📚 Resources

### **Documentation**
- [API Reference](api-reference.md)
- [Platform Integration](platforms.md)
- [Security Guide](security.md)
- [Deployment Guide](deployment.md)

### **External Resources**
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)

### **Community**
- [GitHub Repository](https://github.com/zawgyiai/zawgyiai)
- [Discord Community](https://discord.gg/zawgyiai)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/zawgyiai)

---

## 🎯 Conclusion

This developer guide provides comprehensive information for:

- ✅ Understanding ZawgyiAI architecture
- ✅ Building custom capabilities
- ✅ Integrating new platforms
- ✅ Developing REST APIs
- ✅ Testing and debugging
- ✅ Deployment and optimization
- ✅ Contributing to the project

For more information, refer to the complete documentation at http://localhost:3006/docs/

---

**🏆 Happy Coding with ZawgyiAI! 🏆**

*Build amazing multi-platform communication experiences with ZawgyiAI.*
