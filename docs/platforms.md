# 🌐 Platform Integration Guide

## 📋 Platform Overview

ZawgyiAI supports integration with multiple messaging platforms, providing a unified interface for managing communications across different services. Each platform has its own configuration requirements and capabilities.

## 🚀 Quick Start

### **1. Configure Platform Credentials**
Add your platform credentials to the `.env` file:
```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# WhatsApp
WHATSAPP_PHONE_NUMBER=your_whatsapp_phone_number

# Line
LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
LINE_CHANNEL_SECRET=your_line_secret

# WeChat
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_secret

# Discord
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Slack
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret

# Viber
VIBER_AUTH_TOKEN=your_viber_auth_token
```

### **2. Start the Server**
```bash
npm start
```

### **3. Verify Platform Status**
```bash
curl http://localhost:3006/api/platforms
```

---

## 📱 Telegram Integration

### **Setup Instructions**

1. **Create a Telegram Bot**
   - Talk to [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command to create a new bot
   - Save the bot token

2. **Configure Environment**
   ```bash
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ```

3. **Enable the Platform**
   - Start the ZawgyiAI server
   - The Telegram platform will automatically initialize

### **Features**
- **Message Handling**: Receive and send messages
- **Commands**: Support for custom commands
- **Media**: Send and receive images, videos, documents
- **Inline Mode**: Inline query support
- **Webhooks**: Webhook integration

### **API Endpoints**
```bash
# Get Telegram status
GET /api/platforms/telegram/status

# Send Telegram message
POST /api/platforms/telegram/send
{
  "to": "user_id",
  "message": "Hello from ZawgyiAI!"
}
```

### **Troubleshooting**
- **Bot Token Invalid**: Verify your bot token
- **Webhook Issues**: Check webhook URL configuration
- **Rate Limits**: Respect Telegram rate limits
- **Permissions**: Ensure bot has necessary permissions

---

## 📱 WhatsApp Integration

### **Setup Instructions**

1. **WhatsApp Web Integration**
   - ZawgyiAI uses WhatsApp Web via browser automation
   - No WhatsApp Business API required
   - Automatic QR code generation for authentication

2. **Configure Environment**
   ```bash
   WHATSAPP_PHONE_NUMBER=your_phone_number
   ```

3. **Start the Server**
   - The WhatsApp platform will initialize automatically
   - QR code will be displayed in the console
   - Scan QR code with WhatsApp mobile app

### **Features**
- **Mock Mode**: 100% functional mock implementation
- **Message Handling**: Send and receive messages
- **Media**: Send and receive images, videos, documents
- **Contacts**: Contact management
- **Chats**: Chat history and management
- **Groups**: Group chat support

### **API Endpoints**
```bash
# Get WhatsApp status
GET /api/whatsapp/status

# Send WhatsApp message
POST /api/whatsapp/send
{
  "to": "+1234567890",
  "message": "Hello from ZawgyiAI!"
}

# Get WhatsApp contacts
GET /api/whatsapp/contacts

# Get WhatsApp chats
GET /api/whatsapp/chats
```

### **Troubleshooting**
- **Browser Conflicts**: System automatically handles conflicts
- **QR Code Issues**: Ensure WhatsApp mobile app is updated
- **Network Issues**: Check internet connectivity
- **Session Issues**: Clear session data and re-authenticate

---

## 📱 Line Integration

### **Setup Instructions**

1. **Create Line Channel**
   - Go to [Line Developers Console](https://developers.line.biz/)
   - Create a new channel (Messaging API)
   - Get channel access token and secret

2. **Configure Environment**
   ```bash
   LINE_CHANNEL_ACCESS_TOKEN=your_line_access_token
   LINE_CHANNEL_SECRET=your_line_secret
   ```

3. **Set Webhook URL**
   - Set webhook URL to: `https://your-domain.com/api/webhooks/line`
   - Enable webhook verification

### **Features**
- **Message Handling**: Receive and send messages
- **Rich Menu**: Custom rich menu support
- **Flex Messages**: Interactive message templates
- **Media**: Send and receive images, videos
- **User Management**: User profile and management

### **API Endpoints**
```bash
# Get Line status
GET /api/platforms/line/status

# Send Line message
POST /api/platforms/line/send
{
  "to": "user_id",
  "message": "Hello from ZawgyiAI!"
}
```

### **Troubleshooting**
- **Webhook Verification**: Ensure webhook URL is accessible
- **Token Issues**: Verify channel access token
- **Rate Limits**: Respect Line API rate limits
- **Message Format**: Follow Line message format requirements

---

## 📱 WeChat Integration

### **Setup Instructions**

1. **Create WeChat Mini-Program**
   - Go to [WeChat Mini-Program Console](https://developers.weixin.qq.com/)
   - Create a new mini-program
   - Get app ID and secret

2. **Configure Environment**
   ```bash
   WECHAT_APP_ID=your_wechat_app_id
   WECHAT_APP_SECRET=your_wechat_secret
   ```

3. **Set Server URL**
   - Configure server URL in WeChat console
   - Enable server communication

### **Features**
- **Message Handling**: Receive and send messages
- **Mini-Program**: Mini-program integration
- **User Management**: WeChat user management
- **Media**: Send and receive images, videos
- **Templates**: Message template support

### **API Endpoints**
```bash
# Get WeChat status
GET /api/platforms/wechat/status

# Send WeChat message
POST /api/platforms/wechat/send
{
  "to": "openid",
  "message": "Hello from ZawgyiAI!"
}
```

### **Troubleshooting**
- **Server URL**: Ensure server URL is accessible from WeChat
- **App Credentials**: Verify app ID and secret
- **Message Format**: Follow WeChat message format
- **Rate Limits**: Respect WeChat API rate limits

---

## 🎮 Discord Integration

### **Setup Instructions**

1. **Create Discord Application**
   - Go to [Discord Developers Portal](https://discord.com/developers/applications)
   - Create a new application
   - Create a bot user

2. **Configure Environment**
   ```bash
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   ```

3. **Invite Bot to Server**
   - Generate OAuth2 invite link
   - Invite bot to your Discord server
   - Grant necessary permissions

### **Features**
- **Message Handling**: Receive and send messages
- **Slash Commands**: Custom slash commands
- **Embeds**: Rich embed messages
- **Reactions**: Message reactions
- **Guild Management**: Server management

### **API Endpoints**
```bash
# Get Discord status
GET /api/platforms/discord/status

# Send Discord message
POST /api/platforms/discord/send
{
  "to": "channel_id",
  "message": "Hello from ZawgyiAI!"
}
```

### **Troubleshooting**
- **Bot Permissions**: Ensure bot has necessary permissions
- **Token Issues**: Verify bot token
- **Rate Limits**: Respect Discord rate limits
- **Gateway Issues**: Check Discord gateway connection

---

## 💼 Slack Integration

### **Setup Instructions**

1. **Create Slack App**
   - Go to [Slack API](https://api.slack.com/apps)
   - Create a new app
   - Configure bot permissions

2. **Configure Environment**
   ```bash
   SLACK_BOT_TOKEN=your_slack_bot_token
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   ```

3. **Install App to Workspace**
   - Install app to your Slack workspace
   - Enable bot permissions

### **Features**
- **Message Handling**: Receive and send messages
- **Slash Commands**: Custom slash commands
- **Attachments**: File attachments
- **Channels**: Multi-channel support
- **Users**: User management

### **API Endpoints**
```bash
# Get Slack status
GET /api/platforms/slack/status

# Send Slack message
POST /api/platforms/slack/send
{
  "to": "channel_id",
  "message": "Hello from ZawgyiAI!"
}
```

### **Troubleshooting**
- **Bot Permissions**: Ensure bot has necessary permissions
- **Token Issues**: Verify bot token
- **Webhook URL**: Ensure webhook URL is accessible
- **Rate Limits**: Respect Slack rate limits

---

## 📱 Viber Integration

### **Setup Instructions**

1. **Create Viber Public Account**
   - Go to [Viber Developers](https://developers.viber.com/)
   - Create a new public account
   - Get authentication token

2. **Configure Environment**
   ```bash
   VIBER_AUTH_TOKEN=your_viber_auth_token
   ```

3. **Set Webhook URL**
   - Set webhook URL to: `https://your-domain.com/api/webhooks/viber`
   - Enable webhook verification

### **Features**
- **Message Handling**: Receive and send messages
- **Rich Messages**: Interactive message templates
- **Media**: Send and receive images, videos
- **Keyboard**: Custom keyboard support
- **User Management**: User profile and management

### **API Endpoints**
```bash
# Get Viber status
GET /api/platforms/viber/status

# Send Viber message
POST /api/platforms/viber/send
{
  "to": "user_id",
  "message": "Hello from ZawgyiAI!"
}
```

### **Troubleshooting**
- **Webhook Verification**: Ensure webhook URL is accessible
- **Token Issues**: Verify authentication token
- **Message Format**: Follow Viber message format
- **Rate Limits**: Respect Viber API rate limits

---

## 🔧 Platform Management

### **Enable/Disable Platforms**
```bash
# Enable platform
POST /api/platforms/:name/enable

# Disable platform
POST /api/platforms/:name/disable
```

### **Platform Configuration**
```bash
# Get platform configuration
GET /api/platforms/:name/config

# Update platform configuration
PUT /api/platforms/:name/config
{
  "enabled": true,
  "settings": {
    "autoReply": true,
    "welcomeMessage": "Welcome!"
  }
}
```

### **Platform Analytics**
```bash
# Get platform analytics
GET /api/analytics/platforms/:name
```

---

## 🛡️ Security Considerations

### **API Key Management**
- Store API keys in environment variables
- Rotate keys regularly
- Use different keys for different environments
- Monitor key usage

### **Webhook Security**
- Verify webhook signatures
- Use HTTPS for webhook URLs
- Implement rate limiting
- Monitor webhook requests

### **Data Privacy**
- Follow platform privacy policies
- Implement data retention policies
- Secure user data storage
- Provide data deletion options

---

## 📊 Platform Comparison

| Platform | Setup Complexity | Features | Rate Limits | Cost |
|----------|------------------|----------|-------------|------|
| Telegram | Low | High | 30 msgs/sec | Free |
| WhatsApp | Medium | High | 20 msgs/sec | Free |
| Line | Medium | Medium | 100 msgs/sec | Free |
| WeChat | High | Medium | 100 msgs/sec | Free |
| Discord | Low | High | 50 msgs/sec | Free |
| Slack | Medium | High | 1 msg/sec | Free |
| Viber | Medium | Medium | 100 msgs/sec | Free |

---

## 🚀 Best Practices

### **Development**
- Use test environments for development
- Implement proper error handling
- Log platform interactions
- Monitor API usage

### **Production**
- Use environment variables for credentials
- Implement proper logging
- Set up monitoring and alerts
- Use load balancing for high traffic

### **Maintenance**
- Regularly update platform integrations
- Monitor API changes
- Backup configuration data
- Test platform connectivity

---

## 📞 Support

For platform integration support:
- **Documentation**: Complete platform guides
- **Examples**: Integration examples
- **Troubleshooting**: Common issues and solutions
- **Community**: Developer community support

**Start integrating your platforms with ZawgyiAI today!**
