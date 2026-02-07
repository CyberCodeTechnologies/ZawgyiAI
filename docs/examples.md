# 💡 ZawgyiAI Examples

## 🎯 Introduction

This guide provides practical examples of using ZawgyiAI capabilities, API integrations, and custom implementations. Learn by doing with these real-world examples!

---

## 🤖 AI Chat Examples

### **Basic Conversation**
```javascript
// Send message to AI
const response = await agent.processMessage('user123', 'Hello, how are you?', 'telegram');
console.log(response); // "Hello! I'm ZawgyiAI, your AI assistant. How can I help you today?"
```

### **Context-Aware Chat**
```javascript
// Follow-up conversation
await agent.processMessage('user123', 'Tell me about AI', 'telegram');
await agent.processMessage('user123', 'What about machine learning?', 'telegram');
// AI remembers the context of the previous conversation
```

### **Multi-Language Support**
```javascript
// Different language examples
await agent.processMessage('user123', 'Hola, ¿cómo estás?', 'telegram');
await agent.processMessage('user123', 'Bonjour, comment allez-vous?', 'telegram');
await agent.processMessage('user123', 'こんにちは', 'telegram');
```

---

## 📸 Surveillance Examples

### **Camera Operations**
```javascript
// Take a photo
const photoResult = await surveillanceCapability.execute('take_photo', {}, 'user123');
console.log(photoResult);
// { success: true, path: '/data/surveillance/latest_capture.jpg', timestamp: '...' }

// Check camera status
const statusResult = await surveillanceCapability.execute('get_camera_status', {}, 'user123');
console.log(statusResult);
// { success: true, cameras: [{ deviceId: 'cam1', label: 'Integrated Camera' }] }
```

### **Screenshot Capture**
```javascript
// Capture system screenshot
const screenshotResult = await surveillanceCapability.execute('take_screenshot', {}, 'user123');
console.log(screenshotResult);
// { success: true, path: '/data/surveillance/latest_screenshot.jpg' }
```

### **Video Recording**
```javascript
// Start video recording
await surveillanceCapability.execute('start_video_recording', {
    duration: 300, // 5 minutes
    quality: 'high'
}, 'user123');

// Stop video recording
await surveillanceCapability.execute('stop_video_recording', {}, 'user123');
```

---

## 📁 File Management Examples

### **File Operations**
```javascript
// Create a new file
await fileEditorCapability.execute('create_file', {
    path: '/data/files/notes.txt',
    content: 'Hello, this is my note!'
}, 'user123');

// Read file content
const fileContent = await fileEditorCapability.execute('read_file', {
    path: '/data/files/notes.txt'
}, 'user123');

// Edit existing file
await fileEditorCapability.execute('edit_file', {
    path: '/data/files/notes.txt',
    operation: 'replace',
    search: 'Hello',
    replace: 'Hi'
}, 'user123');

// List directory
const fileList = await fileEditorCapability.execute('list_directory', {
    path: '/data/files',
    recursive: false
}, 'user123');
```

### **Code Editing**
```javascript
// Create a JavaScript file
await fileEditorCapability.execute('create_file', {
    path: '/data/files/app.js',
    content: `
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello World!'));
app.listen(3000);
`
}, 'user123');

// Edit code with syntax highlighting support
await fileEditorCapability.execute('edit_file', {
    path: '/data/files/app.js',
    operation: 'insert',
    position: 3,
    content: 'app.use(express.json());'
}, 'user123');
```

---

## 📧 Email Integration Examples

### **Send Email**
```javascript
// Send a simple email
await emailCapability.execute('send_email', {
    to: 'recipient@example.com',
    subject: 'Hello from ZawgyiAI',
    body: 'This is a test email sent via ZawgyiAI'
}, 'user123');

// Send email with attachment
await emailCapability.execute('send_email', {
    to: 'recipient@example.com',
    subject: 'Report Attached',
    body: 'Please find the report attached',
    attachments: ['/data/files/report.pdf']
}, 'user123');
```

### **Read Emails**
```javascript
// Read inbox
const emails = await emailCapability.execute('read_emails', {
    folder: 'inbox',
    limit: 10,
    unreadOnly: true
}, 'user123');

// Read specific email
const email = await emailCapability.execute('read_email', {
    messageId: 'msg123',
    folder: 'inbox'
}, 'user123');
```

### **Email Templates**
```javascript
// Create email template
await emailCapability.execute('create_template', {
    name: 'WelcomeTemplate',
    subject: 'Welcome {{name}}!',
    body: 'Hello {{name}}, welcome to our service!'
}, 'user123');

// Use template
await emailCapability.execute('send_email', {
    to: 'newuser@example.com',
    template: 'WelcomeTemplate',
    variables: { name: 'John' }
}, 'user123');
```

---

## 📅 Calendar Integration Examples

### **Event Management**
```javascript
// Create calendar event
await calendarCapability.execute('create_event', {
    title: 'Team Meeting',
    description: 'Weekly team sync',
    startTime: '2024-02-04T10:00:00Z',
    endTime: '2024-02-04T11:00:00Z',
    attendees: ['user1@example.com', 'user2@example.com'],
    reminder: 15
}, 'user123');

// Get events for date range
const events = await calendarCapability.execute('get_events', {
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    calendar: 'primary'
}, 'user123');

// Update event
await calendarCapability.execute('update_event', {
    eventId: 'event123',
    updates: {
        title: 'Updated Meeting',
        startTime: '2024-02-04T14:00:00Z'
    }
}, 'user123');
```

### **Recurring Events**
```javascript
// Create recurring event
await calendarCapability.execute('create_event', {
    title: 'Daily Standup',
    description: 'Daily team standup meeting',
    startTime: '2024-02-04T09:00:00Z',
    endTime: '2024-02-04T09:30:00Z',
    recurrence: {
        frequency: 'daily',
        interval: 1,
        endDate: '2024-03-04'
    }
}, 'user123');
```

---

## 🤖 Multi-Agent System Examples

### **Agent Creation**
```javascript
// Create specialized agents
await multiAgentCapability.execute('create_agent', {
    name: 'CustomerServiceAgent',
    type: 'customer_service',
    capabilities: ['chat', 'escalation', 'knowledge'],
    config: {
        maxTasks: 10,
        priority: 'high',
        workingHours: '9-5'
    }
}, 'user123');

// Create research agent
await multiAgentCapability.execute('create_agent', {
    name: 'ResearchAgent',
    type: 'research',
    capabilities: ['web_search', 'data_analysis', 'reporting'],
    config: {
        maxTasks: 5,
        priority: 'medium'
    }
}, 'user123');
```

### **Task Assignment**
```javascript
// Assign task to agent
await multiAgentCapability.execute('assign_task', {
    agentId: 'agent123',
    task: {
        type: 'customer_inquiry',
        priority: 'high',
        data: {
            customerId: 'cust456',
            inquiry: 'Product question',
            platform: 'telegram'
        }
    }
}, 'user123');

// Monitor agent performance
const performance = await multiAgentCapability.execute('get_agent_performance', {
    agentId: 'agent123',
    timeRange: '24h'
}, 'user123');
```

---

## ⚙️ Automation Examples

### **Workflow Creation**
```javascript
// Create automated workflow
await automationCapability.execute('create_workflow', {
    name: 'DailyReport',
    description: 'Generate daily reports',
    triggers: [
        {
            type: 'schedule',
            schedule: '0 9 * * *' // 9 AM daily
        }
    ],
    actions: [
        {
            type: 'generate_report',
            parameters: {
                type: 'daily',
                format: 'pdf'
            }
        },
        {
            type: 'send_email',
            parameters: {
                to: 'manager@example.com',
                subject: 'Daily Report',
                template: 'ReportTemplate'
            }
        }
    ]
}, 'user123');
```

### **Scheduled Tasks**
```javascript
// Schedule one-time task
await automationCapability.execute('schedule_task', {
    name: 'BackupTask',
    schedule: '2024-02-04T02:00:00Z',
    action: 'backup_database',
    parameters: {
        destination: '/backups/',
        compression: true
    }
}, 'user123');

// Create recurring task
await automationCapability.execute('schedule_task', {
    name: 'SystemCleanup',
    schedule: '0 2 * * 0', // Every Sunday at 2 AM
    action: 'cleanup_system',
    parameters: {
        tempFiles: true,
        logs: true,
        cache: true
    }
}, 'user123');
```

---

## 🌐 Multi-Platform Examples

### **Cross-Platform Messaging**
```javascript
// Send message to all platforms
await multiPlatformChatCapability.execute('send_to_all', {
    message: 'System maintenance scheduled for 2 AM UTC',
    platforms: ['telegram', 'discord', 'slack']
}, 'user123');

// Platform-specific message
await multiPlatformChatCapability.execute('send_to_platform', {
    platform: 'telegram',
    message: 'Telegram-specific announcement',
    chatId: '@mychannel'
}, 'user123');
```

### **Platform Sync**
```javascript
// Sync messages across platforms
await multiPlatformChatCapability.execute('sync_message', {
    sourcePlatform: 'telegram',
    sourceMessageId: 'msg123',
    targetPlatforms: ['discord', 'slack'],
    message: 'This message is synced across platforms'
}, 'user123');
```

---

## 🔌 API Integration Examples

### **REST API Usage**
```javascript
// Using fetch to call ZawgyiAI API
const response = await fetch('http://localhost:3006/api/capabilities/surveillance/execute', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key'
    },
    body: JSON.stringify({
        action: 'take_screenshot'
    })
});

const result = await response.json();
console.log(result);
```

### **Webhook Integration**
```javascript
// Set up webhook for external service
await fetch('http://localhost:3006/api/webhooks/external', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        event: 'user_message',
        url: 'https://your-service.com/webhook',
        secret: 'your-webhook-secret'
    })
});
```

### **WebSocket Connection**
```javascript
// Connect to ZawgyiAI WebSocket
const ws = new WebSocket('ws://localhost:3007');

ws.on('open', () => {
    console.log('Connected to ZawgyiAI WebSocket');
    
    // Subscribe to events
    ws.send(JSON.stringify({
        type: 'subscribe',
        events: ['message_received', 'capability_executed']
    }));
});

ws.on('message', (data) => {
    const event = JSON.parse(data);
    console.log('Received event:', event);
});
```

---

## 🛡️ Security Examples

### **Authentication**
```javascript
// Generate API key
const apiKey = await fetch('http://localhost:3006/api/auth/generate-key', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token'
    },
    body: JSON.stringify({
        name: 'My API Key',
        permissions: ['read', 'write']
    })
});

const { key } = await apiKey.json();
```

### **Rate Limiting**
```javascript
// Check rate limit status
const rateLimitStatus = await fetch('http://localhost:3006/api/security/rate-limit', {
    headers: {
        'Authorization': `Bearer ${apiKey}`
    }
});

const { remaining, reset } = await rateLimitStatus.json();
console.log(`Requests remaining: ${remaining}`);
```

### **Audit Logging**
```javascript
// Get audit log
const auditLog = await fetch('http://localhost:3006/api/security/audit-log', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
        limit: 100,
        level: 'warning',
        startDate: '2024-02-01',
        endDate: '2024-02-04'
    })
});
```

---

## 📊 Monitoring Examples

### **System Health**
```javascript
// Get system health
const health = await fetch('http://localhost:3006/health');
const healthData = await health.json();

console.log('System Health:', {
    status: healthData.status,
    uptime: healthData.uptime,
    memory: healthData.memory,
    capabilities: healthData.capabilities
});
```

### **Performance Metrics**
```javascript
// Get performance metrics
const metrics = await fetch('http://localhost:3006/api/analytics/performance');
const perfData = await metrics.json();

console.log('Performance:', {
    responseTime: perfData.averageResponseTime,
    requestsPerSecond: perfData.rps,
    errorRate: perfData.errorRate,
    memoryUsage: perfData.memoryUsage
});
```

---

## 🎨 Custom Capability Examples

### **Weather Capability**
```javascript
const { ZawgyiCapability } = require('../core/zawgyi-capability');
const axios = require('axios');

class WeatherCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('weather', 'Weather information and forecasts');
        this.gateway = gateway;
        this.setupActions();
    }

    setupActions() {
        this.addAction('get_weather', this.getWeather.bind(this), {
            description: 'Get current weather for a location',
            parameters: ['location']
        });
    }

    async getWeather(params, userId) {
        const { location } = params;
        const apiKey = process.env.WEATHER_API_KEY;
        
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`
            );

            return {
                success: true,
                location: response.data.name,
                temperature: response.data.main.temp,
                description: response.data.weather[0].description,
                message: `Weather in ${response.data.name}: ${response.data.main.temp}°C`
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch weather data'
            };
        }
    }
}
```

### **News Capability**
```javascript
class NewsCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('news', 'News and information feeds');
        this.gateway = gateway;
        this.setupActions();
    }

    setupActions() {
        this.addAction('get_headlines', this.getHeadlines.bind(this), {
            description: 'Get latest news headlines',
            parameters: ['category']
        });
    }

    async getHeadlines(params, userId) {
        const { category = 'general' } = params;
        const apiKey = process.env.NEWS_API_KEY;
        
        try {
            const response = await axios.get(
                `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey}`
            );

            return {
                success: true,
                articles: response.data.articles.slice(0, 5),
                message: `Latest ${category} headlines`
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch news'
            };
        }
    }
}
```

---

## 🔧 Integration Examples

### **Slack Bot Integration**
```javascript
// Custom Slack bot using ZawgyiAI
const { WebClient } = require('@slack/web-api');
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// Handle Slack events
async function handleSlackEvent(event) {
    if (event.type === 'message' && !event.bot_id) {
        // Process message through ZawgyiAI
        const response = await agent.processMessage(
            event.user,
            event.text,
            'slack'
        );

        // Send response back to Slack
        await slackClient.chat.postMessage({
            channel: event.channel,
            text: response
        });
    }
}
```

### **Discord Bot Integration**
```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

discordClient.on('messageCreate', async (message) => {
    if (!message.author.bot) {
        // Process through ZawgyiAI
        const response = await agent.processMessage(
            message.author.id,
            message.content,
            'discord'
        );

        // Send response
        message.reply(response);
    }
});
```

### **Telegram Bot Integration**
```javascript
const { Telegraf } = require('telegraf');
const telegramBot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

telegramBot.on('message', async (ctx) => {
    // Process through ZawgyiAI
    const response = await agent.processMessage(
        ctx.from.id.toString(),
        ctx.message.text,
        'telegram'
    );

    // Send response
    ctx.reply(response);
});
```

---

## 📱 Mobile App Examples

### **React Native Integration**
```javascript
// React Native app using ZawgyiAI API
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';

const ZawgyiApp = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = async () => {
        try {
            const response = await fetch('http://your-server:3006/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer your-api-key'
                },
                body: JSON.stringify({
                    message: input,
                    platform: 'mobile'
                })
            });

            const result = await response.json();
            setMessages([...messages, 
                { type: 'user', text: input },
                { type: 'bot', text: result.response }
            ]);
            setInput('');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <View>
            <FlatList
                data={messages}
                renderItem={({ item }) => (
                    <Text>{item.type}: {item.text}</Text>
                )}
            />
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Type a message..."
            />
            <Button title="Send" onPress={sendMessage} />
        </View>
    );
};
```

---

## 🌐 Web Integration Examples

### **Frontend Integration**
```html
<!DOCTYPE html>
<html>
<head>
    <title>ZawgyiAI Web Integration</title>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <input type="text" id="message-input" placeholder="Type a message...">
        <button onclick="sendMessage()">Send</button>
    </div>

    <script>
        async function sendMessage() {
            const input = document.getElementById('message-input');
            const messages = document.getElementById('messages');
            
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: input.value,
                    platform: 'web'
                })
            });

            const result = await response.json();
            
            messages.innerHTML += `
                <div>User: ${input.value}</div>
                <div>Bot: ${result.response}</div>
            `;
            
            input.value = '';
        }
    </script>
</body>
</html>
```

---

## 📊 Data Analysis Examples

### **Analytics Dashboard**
```javascript
// Create analytics dashboard
async function createDashboard() {
    const metrics = await fetch('/api/analytics/dashboard');
    const data = await metrics.json();

    // Display metrics
    console.log('Daily Messages:', data.dailyMessages);
    console.log('Active Users:', data.activeUsers);
    console.log('Platform Usage:', data.platformUsage);
    console.log('Capability Usage:', data.capabilityUsage);

    // Generate charts
    createChart('messages-chart', data.messageHistory);
    createChart('platforms-chart', data.platformUsage);
    createChart('capabilities-chart', data.capabilityUsage);
}
```

### **Report Generation**
```javascript
// Generate usage report
async function generateReport(startDate, endDate) {
    const report = await fetch('/api/reports/usage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            startDate,
            endDate,
            format: 'pdf'
        })
    });

    const blob = await report.blob();
    const url = URL.createObjectURL(blob);
    
    // Download report
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-report-${startDate}.pdf`;
    a.click();
}
```

---

## 🎯 Best Practices

### **Error Handling**
```javascript
// Always handle errors properly
try {
    const result = await capability.execute(action, params, userId);
    if (result.success) {
        console.log('Success:', result.message);
    } else {
        console.error('Capability error:', result.error);
    }
} catch (error) {
    console.error('Unexpected error:', error);
    // Fallback behavior
}
```

### **Resource Management**
```javascript
// Clean up resources
class ResourceManager {
    constructor() {
        this.resources = new Map();
    }

    async acquire(name, factory) {
        if (!this.resources.has(name)) {
            this.resources.set(name, await factory());
        }
        return this.resources.get(name);
    }

    async release(name) {
        const resource = this.resources.get(name);
        if (resource && typeof resource.close === 'function') {
            await resource.close();
        }
        this.resources.delete(name);
    }
}
```

### **Security**
```javascript
// Always validate inputs
function validateInput(input, type) {
    switch (type) {
        case 'email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
        case 'phone':
            return /^\+?[\d\s-]+$/.test(input);
        case 'filename':
            return /^[a-zA-Z0-9._-]+$/.test(input);
        default:
            return typeof input === 'string' && input.length > 0;
    }
}
```

---

## 🚀 Advanced Examples

### **Custom Workflow Engine**
```javascript
class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.running = new Map();
    }

    async executeWorkflow(name, context) {
        const workflow = this.workflows.get(name);
        if (!workflow) {
            throw new Error(`Workflow ${name} not found`);
        }

        const execution = {
            id: generateId(),
            workflow: name,
            status: 'running',
            startTime: Date.now(),
            context
        };

        this.running.set(execution.id, execution);

        try {
            for (const step of workflow.steps) {
                await this.executeStep(step, context);
            }

            execution.status = 'completed';
            execution.endTime = Date.now();
        } catch (error) {
            execution.status = 'failed';
            execution.error = error.message;
        }

        return execution;
    }

    async executeStep(step, context) {
        switch (step.type) {
            case 'capability':
                return await this.executeCapability(step, context);
            case 'condition':
                return await this.executeCondition(step, context);
            case 'loop':
                return await this.executeLoop(step, context);
            default:
                throw new Error(`Unknown step type: ${step.type}`);
        }
    }
}
```

### **Real-time Collaboration**
```javascript
// Real-time collaboration using WebSockets
class CollaborationManager {
    constructor() {
        this.sessions = new Map();
        this.participants = new Map();
    }

    createSession(name, creator) {
        const session = {
            id: generateId(),
            name,
            creator,
            participants: new Set([creator]),
            createdAt: Date.now()
        };

        this.sessions.set(session.id, session);
        return session;
    }

    joinSession(sessionId, participant) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.participants.add(participant);
        this.participants.set(participant, sessionId);

        // Notify other participants
        this.broadcast(sessionId, {
            type: 'participant_joined',
            participant
        });

        return session;
    }

    broadcast(sessionId, message) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.participants.forEach(participant => {
            this.sendToParticipant(participant, message);
        });
    }
}
```

---

## 📞 Support for Examples

### **Getting Help**
- **Documentation**: Complete docs at http://localhost:3006/docs/
- **Examples Repository**: https://github.com/zawgyiai/examples
- **Community**: Discord at https://discord.gg/zawgyiai
- **Issues**: Report problems at https://github.com/zawgyiai/zawgyiai/issues

### **Contributing Examples**
- **Submit Examples**: Create pull requests with new examples
- **Improve Examples**: Enhance existing examples
- **Document Examples**: Add better documentation
- **Test Examples**: Ensure examples work correctly

---

**🏆 Start Building with ZawgyiAI Examples! 🏆**

*Use these examples as starting points for your own projects and integrations.*
