# WhatsApp Configuration Setup Guide

## Overview
This guide explains how to set up and use the WhatsApp capability in Zawgyi AI.

## Prerequisites
- WhatsApp mobile app installed on your smartphone
- Active WhatsApp account
- Node.js project with `whatsapp-web.js` package installed

## Configuration

### 1. Environment Variables
Add the following to your `.env` file:
```env
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER=+959788989800
```

### 2. Directory Structure
The WhatsApp capability creates the following directories:
- `./data/whatsapp-session/` - Stores WhatsApp session data
- `./data/whatsapp-media/` - Stores downloaded media files

## Usage

### 1. Basic Integration
```javascript
const WhatsAppCapability = require('./src/capabilities/whatsapp');

const whatsapp = new WhatsAppCapability();
await whatsapp.initialize();
```

### 2. Sending Messages
```javascript
// Send text message
await whatsapp.sendMessage('+1234567890', 'Hello from Zawgyi AI!');

// Send media
await whatsapp.sendMedia('+1234567890', './path/to/image.jpg', 'Check this out!');
```

### 3. Receiving Messages
```javascript
whatsapp.setMessageHandler(async (message) => {
    console.log(`Message from ${message.from}: ${message.body}`);
    
    // Process message and respond
    if (message.body.toLowerCase() === 'hello') {
        await whatsapp.sendMessage(message.from, 'Hello! How can I help you?');
    }
});
```

### 4. Getting Information
```javascript
// Get contacts
const contacts = await whatsapp.getContacts();

// Get chats
const chats = await whatsapp.getChats();

// Check status
const status = whatsapp.getStatus();
```

## Testing

### Run Integration Test
```bash
node test-whatsapp-integration.js
```

### Run Standalone Test
```bash
node test-whatsapp.js
```

## Features

### ✅ Implemented
- QR code authentication
- Text message sending/receiving
- Media file handling
- Contact management
- Chat management
- Session persistence
- Group message handling
- Error handling and logging

### 🚧 Advanced Features
- Message templates
- Bulk messaging
- Interactive buttons
- Location sharing
- Voice messages
- Document processing

## Security Considerations

### ⚠️ Important Notes
1. **Never share your phone number** in public repositories
2. **Keep session files secure** - they contain authentication data
3. **Rate limiting** is implemented to prevent being blocked
4. **Respect WhatsApp Terms of Service**

### 🔒 Best Practices
- Use environment variables for sensitive data
- Implement proper error handling
- Don't spam messages
- Handle authentication failures gracefully
- Log activities for debugging

## Troubleshooting

### Common Issues

#### 1. QR Code Not Appearing
```bash
# Check if Puppeteer is working
npm list puppeteer
```

#### 2. Authentication Failure
```bash
# Clear session and try again
rm -rf ./data/whatsapp-session/*
```

#### 3. Connection Issues
- Check internet connection
- Verify phone number format
- Ensure WhatsApp mobile app is active

#### 4. Memory Issues
- Increase Node.js memory limit:
```bash
node --max-old-space-size=4096 src/index.js
```

## API Reference

### WhatsAppCapability Class

#### Methods
- `initialize()` - Initialize WhatsApp client
- `sendMessage(to, message)` - Send text message
- `sendMedia(to, mediaPath, caption)` - Send media file
- `getContacts()` - Get all contacts
- `getChats()` - Get all chats
- `setStatus(handler)` - Set message handler
- `getStatus()` - Get client status
- `disconnect()` - Disconnect client

#### Events
- `qr` - QR code received
- `ready` - Client is ready
- `auth_failure` - Authentication failed
- `disconnected` - Client disconnected
- `message` - New message received

## Rate Limiting

To prevent being blocked by WhatsApp:
- **30 messages per minute**
- **1000 messages per hour**
- **1 second cooldown between messages**

## Next Steps

1. Test the basic functionality
2. Implement custom message handlers
3. Add media processing capabilities
4. Set up webhook integration (optional)
5. Configure automated responses

## Support

For issues and questions:
1. Check the logs for error messages
2. Review the troubleshooting section
3. Test with the standalone script
4. Verify environment configuration
