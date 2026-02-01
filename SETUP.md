# Zawgyi AI Setup Guide

## Docker Installation Required

Before running Zawgyi AI, you need to install Docker Desktop on your Windows system.

### Install Docker Desktop

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows

2. **Install Docker Desktop**
   - Run the installer
   - Follow the installation wizard
   - Restart your computer when prompted

3. **Verify Installation**
   ```powershell
   docker --version
   docker-compose --version
   ```

4. **Start Docker Desktop**
   - Launch Docker Desktop from Start Menu
   - Wait for it to fully start (Docker icon in system tray should be green)

## Quick Start After Docker Installation

Once Docker is installed and running:

1. **Open PowerShell or Command Prompt**
   ```powershell
   cd c:\xampp\htdocs\Zawgyi
   ```

2. **Setup Environment**
   ```powershell
   copy .env.example .env
   # Edit .env with your configuration
   notepad .env
   ```

3. **Start Zawgyi AI**
   ```powershell
   docker-compose up -d
   ```

4. **Access the Application**
   - Web Interface: http://localhost
   - Health Check: http://localhost/health

## Alternative: Manual Setup (Without Docker)

If you prefer not to use Docker, you can try the manual setup:

### Prerequisites

- Node.js 18+ (https://nodejs.org/)
- Git (https://git-scm.com/)

### Manual Installation

1. **Install Node.js**
   - Download and install Node.js 18 LTS or later
   - Restart your computer after installation

2. **Verify Node.js Installation**
   ```powershell
   node --version
   npm --version
   ```

3. **Install Dependencies**
   ```powershell
   cd c:\xampp\htdocs\Zawgyi
   npm install --no-optional
   ```

4. **Setup Environment**
   ```powershell
   copy .env.example .env
   # Edit .env with your settings
   ```

5. **Start Application**
   ```powershell
   npm start
   ```

## Configuration

### Required Environment Variables

Edit `.env` file with at least these settings:

```env
# AI Model (choose one)
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Email (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Server
PORT=3000
NODE_ENV=development
```

### Getting API Keys

1. **OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create an account and generate an API key

2. **Anthropic API Key**
   - Go to: https://console.anthropic.com/
   - Create an account and generate an API key

3. **Telegram Bot Token**
   - Start a chat with @BotFather on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token

## Troubleshooting

### Docker Issues

1. **Docker not starting**
   - Make sure Docker Desktop is running
   - Check Windows Subsystem for Linux (WSL2) is enabled
   - Restart Docker Desktop

2. **Port conflicts**
   - Stop other services using port 80/3000
   - Or change ports in docker-compose.yml

3. **Permission issues**
   - Run PowerShell as Administrator
   - Check Docker Desktop permissions

### Manual Setup Issues

1. **Node.js not found**
   - Make sure Node.js is installed and in PATH
   - Restart your terminal/computer

2. **npm install errors**
   - Try: `npm cache clean --force`
   - Then: `npm install --no-optional`
   - Or delete `node_modules` and try again

3. **Module not found errors**
   - Check if all dependencies installed
   - Verify `node_modules` folder exists
   - Try `npm install` again

## Getting Help

If you encounter issues:

1. Check the logs: `docker-compose logs zawgyi-ai`
2. Verify your `.env` configuration
3. Make sure Docker Desktop is running
4. Check system requirements

## Next Steps

Once Zawgyi AI is running:

1. **Configure your AI model** (OpenAI or Anthropic)
2. **Set up email integration** if needed
3. **Connect chat platforms** (Telegram, WhatsApp)
4. **Test the web interface** at http://localhost
5. **Read the full documentation** in README.md

Enjoy using Zawgyi AI! 🤖
