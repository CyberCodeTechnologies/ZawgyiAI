# 🚀 ZawgyiAI Quick Start Guide

## ⚡ Get Started in 5 Minutes

This guide will get you up and running with ZawgyiAI in just 5 minutes!

---

## 🎯 Prerequisites

Before you start, make sure you have:

- **Node.js 16+** installed ([Download Node.js](https://nodejs.org/))
- **Git** installed ([Download Git](https://git-scm.com/))
- **A terminal/command prompt**
- **Internet connection**

---

## 📦 Installation

### **Step 1: Clone the Repository**
```bash
# Clone ZawgyiAI
git clone https://github.com/zawgyiai/zawgyiai.git
cd zawgyiai
```

### **Step 2: Install Dependencies**
```bash
# Install all required packages
npm install
```

### **Step 3: Configure Environment**
```bash
# Copy environment template
cp .env.example .env
```

---

## 🔧 Basic Configuration

### **Step 4: Add Your Bot Token (Optional)**

For quick testing, you can skip this step and use the mock capabilities. To enable real platforms:

#### **Telegram Bot (Easiest to start)**
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Choose a name (e.g., "My ZawgyiAI Bot")
4. Choose a username (e.g., "my_zawgyiai_bot")
5. Copy the bot token
6. Add it to `.env`:
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### **Quick Test (No Configuration Needed)**
You can start without any configuration - all capabilities will work in mock mode!

---

## 🚀 Start the Application

### **Step 5: Launch ZawgyiAI**
```bash
# Start the application
npm start
```

You should see output like:
```
🤖 Zawgyi AI v1.1.1 - Core Framework Initializing
✅ Zawgyi AI Core Framework Ready
🔗 Platform registered: web
🔗 Platform registered: telegram
...
🚀 ZawgyiAI started on port 3006
🌐 Web interface: http://localhost:3006
```

---

## 🌐 Access the Interface

### **Step 6: Open Web Interface**
Open your browser and navigate to:
```
http://localhost:3006
```

### **Step 7: Explore the Documentation**
Visit the documentation at:
```
http://localhost:3006/docs/
```

---

## 📱 Test Your Setup

### **Test 1: Web Interface**
1. Open http://localhost:3006
2. You should see the ZawgyiAI web interface
3. Click on "System Status" to verify everything is working

### **Test 2: API Endpoint**
```bash
# Check system status
curl http://localhost:3006/status
```

### **Test 3: Capabilities**
```bash
# List all capabilities
curl http://localhost:3006/api/capabilities
```

---

## 🤖 Test with Telegram (If Configured)

### **Step 8: Test Your Bot**
1. Find your bot on Telegram
2. Send `/start`
3. Try these commands:
   - `hello` - Test AI chat
   - `camera` - Test surveillance (mock mode)
   - `screenshot` - Test screen capture
   - `help` - Get help

### **Example Commands**
```
/user: hello
/bot: Hello! I'm ZawgyiAI, your AI assistant. How can I help you today?

/user: camera
/bot: 📸 Camera capture initiated! (Mock mode - simulated capture)

/user: screenshot
/bot: 🖥️ Screenshot captured successfully! (Mock mode)
```

---

## 🧩 Test Capabilities

### **Test AI Chat**
Send any message to test the AI:
- "Tell me about AI"
- "What can you do?"
- "Help me with homework"

### **Test Surveillance**
Try these commands:
- `camera` - Take photo
- `screenshot` - Capture screen
- `camera status` - Check camera

### **Test File Operations**
- `create file test.txt` - Create file
- `list files` - List files
- `read file test.txt` - Read file

---

## 🔧 Troubleshooting

### **Common Issues**

#### **Port Already in Use**
```bash
# Kill existing Node processes
taskkill /F /IM node.exe  # Windows
pkill -f node              # Linux/Mac

# Or use different port
PORT=3007 npm start
```

#### **Module Not Found**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

#### **Permission Denied**
```bash
# On Linux/Mac
sudo npm start

# Or use npx
npx node src/index.js
```

#### **Bot Not Responding**
1. Check if bot token is correct
2. Verify internet connection
3. Check console for error messages
4. Try restarting the application

---

## 📊 What You Get

After completing this quick start, you have:

✅ **Working ZawgyiAI Instance** - Full system running locally  
✅ **Web Interface** - Modern web dashboard  
✅ **33 AI Capabilities** - All capabilities loaded and ready  
✅ **8 Platform Integrations** - Multi-platform support  
✅ **Complete Documentation** - Full docs available  
✅ **API Access** - REST API for integration  
✅ **Security Features** - Enterprise-grade security  

---

## 🎯 Next Steps

### **Explore More**
- 📖 **Read the User Guide**: [user-guide.md](user-guide.md)
- 👨‍💻 **Developer Guide**: [developer-guide.md](developer-guide.md)
- 🔌 **Platform Setup**: [platforms.md](platforms.md)
- 🛡️ **Security Guide**: [security.md](security.md)

### **Configure More Platforms**
- **WhatsApp**: QR code authentication
- **Discord**: Bot token setup
- **Slack**: Workspace integration
- **Viber**: Public account setup

### **Build Custom Capabilities**
- 📚 **Learn the Architecture**: [developer-guide.md](developer-guide.md)
- 🔧 **Create Custom Capabilities**: Follow the template
- 🚀 **Deploy to Production**: [deployment.md](deployment.md)

---

## 🎉 Congratulations!

You now have a fully functional ZawgyiAI system running locally! 

### **What You Can Do Now:**
1. **Chat with AI** - Send messages to test AI capabilities
2. **Use Surveillance** - Try camera and screenshot features
3. **Manage Files** - Test file operations
4. **Explore Web Interface** - Navigate the dashboard
5. **Read Documentation** - Learn advanced features
6. **Configure Platforms** - Add more messaging platforms

### **Quick Commands to Try:**
```
hello                    # Test AI chat
camera                   # Take photo (mock mode)
screenshot              # Capture screen (mock mode)
create file test.txt     # Create test file
list files              # List all files
help                    # Get help
status                  # Check system status
```

---

## 📞 Need Help?

### **Get Support**
- 📚 **Documentation**: http://localhost:3006/docs/
- 💬 **Discord Community**: https://discord.gg/zawgyiai
- 🐛 **Report Issues**: https://github.com/zawgyiai/zawgyiai/issues
- 📧 **Email Support**: support@zawgyiai.com

### **Common Questions**
- **Q: Can I use this without configuration?**
  - A: Yes! All capabilities work in mock mode
  
- **Q: Is this free?**
  - A: Yes, ZawgyiAI is open source and free
  
- **Q: Can I run this on a server?**
  - A: Yes, see [deployment.md](deployment.md) for details

---

## 🚀 You're Ready!

**🏆 Congratulations! You've successfully set up ZawgyiAI! 🏆**

You now have a powerful multi-platform communication system with:
- 🤖 Advanced AI capabilities
- 📱 Multi-platform messaging
- 🛡️ Enterprise-grade security
- 📊 Comprehensive monitoring
- 🔧 Extensible architecture

**Start exploring and building amazing things with ZawgyiAI!**

---

*For more advanced usage, check out our complete documentation at http://localhost:3006/docs/*
