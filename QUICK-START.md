# 🚀 Zawgyi AI Quick Start

## The Problem
You're encountering Node.js dependency issues on Windows. The solution: **Use Docker!**

## 🎯 One-Command Solution

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-docker.ps1
```

### Option 2: Manual Docker Commands
```powershell
# 1. Setup environment
copy .env.example .env
notepad .env  # Edit with your API keys

# 2. Start with Docker
docker-compose up -d

# 3. Check status
docker ps
```

## 📋 What You Need

1. **Docker Desktop** (install from https://www.docker.com/products/docker-desktop/)
2. **API Keys** (at least one):
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/

## ⚡ Quick Setup

1. **Install Docker Desktop** if not already installed
2. **Run the startup script**:
   ```powershell
   .\start-docker.ps1
   ```
3. **Edit .env file** with your API keys
4. **Access Zawgyi AI** at http://localhost

## 🔧 If Docker Isn't Available

If you absolutely cannot use Docker, try this minimal setup:

```powershell
# Clean install
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Install with specific version
npm install --legacy-peer-deps --no-optional

# Start without nodemon
node src/index.js
```

## 🎉 Success Indicators

✅ Docker container running  
✅ Web interface accessible at http://localhost  
✅ Health check passes at http://localhost/health  
✅ Ready to receive commands!  

## 🆘 Troubleshooting

**Docker not found?**
- Install Docker Desktop
- Restart your computer
- Run PowerShell as Administrator

**Port 80 already in use?**
- Stop other web servers (Apache, IIS)
- Or change port in docker-compose.yml

**Container won't start?**
- Check Docker Desktop is running
- Run: `docker-compose logs zawgyi-ai`
- Restart: `docker-compose down && docker-compose up -d`

## 📱 What Zawgyi AI Can Do

Once running, you can:
- 📧 Send and manage emails
- 📅 Create calendar events  
- ✈️ Check in for flights
- 📥 Organize your inbox
- 🤖 Chat via Telegram/WhatsApp

## 🎯 Next Steps

1. Get it running with Docker
2. Configure your API keys in .env
3. Test with the web interface
4. Connect your chat platforms
5. Enjoy your AI assistant!

**Remember: Docker bypasses all Windows dependency issues!** 🐳
