# Docker Setup Guide

## Overview

Zawgyi AI uses Docker for containerized deployment to avoid local dependency issues and ensure consistent environments across development, testing, and production.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Nginx    │────│  Zawgyi AI  │────│    Redis    │
│  (Proxy)    │    │ (Application)│   │   (Cache)   │
│   Port 80   │    │   Port 3000  │   │   Port 6379 │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Quick Start

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Make command (optional, but recommended)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zawgyi-ai
   ```

2. **Setup environment**
   ```bash
   # Using Make (recommended)
   make install
   
   # Or manually
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start**
   ```bash
   # Using Make
   make up
   
   # Or manually
   docker-compose up -d
   ```

4. **Verify installation**
   ```bash
   curl http://localhost/health
   ```

## Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Application
NODE_ENV=production
PORT=3000

# AI Models
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Chat Platforms
TELEGRAM_BOT_TOKEN=your_bot_token
WHATSAPP_PHONE_NUMBER=+1234567890

# Google Services
GOOGLE_CALENDAR_CLIENT_ID=your_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret
```

### Volume Mounts

- `./data:/app/data` - Persistent data storage
- `./logs:/app/logs` - Application logs
- `redis-data:/data` - Redis data persistence

## Development

### Development Mode

For development with hot reload:

```bash
make dev
```

This uses `docker-compose.dev.yml` with:
- Source code mounted for live reloading
- Nodemon for automatic restarts
- Development environment variables

### Building Images

```bash
make build
```

### Viewing Logs

```bash
make logs
```

## Production Deployment

### Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **SSL/TLS**: Configure SSL certificates in nginx
3. **Network Security**: Use Docker networks for isolation
4. **Resource Limits**: Set memory and CPU limits

### Scaling

To scale the application:

```yaml
# docker-compose.yml
services:
  zawgyi-ai:
    deploy:
      replicas: 3
```

### Monitoring

Health checks are built-in:

```bash
# Check container health
docker ps

# View health logs
docker inspect zawgyi-ai | grep Health -A 10
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using port 80/3000
   netstat -tulpn | grep :80
   ```

2. **Permission issues**
   ```bash
   # Fix data directory permissions
   sudo chown -R $USER:$USER ./data
   ```

3. **Container won't start**
   ```bash
   # View detailed logs
   docker-compose logs zawgyi-ai
   ```

### Reset Everything

```bash
make clean
make up
```

### Debug Mode

Run with debugging enabled:

```bash
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up
```

## Maintenance

### Updates

1. **Update images**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. **Backup data**
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz ./data
   ```

3. **Cleanup**
   ```bash
   docker system prune -f
   ```

### Performance

- Monitor resource usage with `docker stats`
- Use Redis for caching frequent operations
- Configure nginx for optimal performance
- Set appropriate resource limits

## Advanced Configuration

### Custom Networks

```yaml
networks:
  zawgyi-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Resource Limits

```yaml
services:
  zawgyi-ai:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### SSL Configuration

1. Place SSL certificates in `./ssl/`
2. Update `nginx.conf` for HTTPS
3. Restart nginx container

## Support

For Docker-specific issues:

1. Check container logs: `make logs`
2. Verify Docker installation: `docker --version`
3. Check system resources: `docker system df`
4. Review configuration files

For application issues, see the main README.md or create an issue in the repository.
