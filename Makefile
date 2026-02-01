.PHONY: help build up down logs clean restart

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker containers
	docker-compose build

up: ## Start the application
	docker-compose up -d
	@echo "🚀 Zawgyi AI is starting..."
	@echo "📱 Web interface: http://localhost"
	@echo "🔗 Health check: http://localhost/health"

down: ## Stop the application
	docker-compose down

logs: ## Show application logs
	docker-compose logs -f zawgyi-ai

clean: ## Clean up containers and volumes
	docker-compose down -v
	docker system prune -f

restart: down up ## Restart the application

dev: ## Start in development mode
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

install: ## Install and setup
	cp .env.example .env
	@echo "⚠️  Please edit .env with your configuration"
	@echo "📝 Then run: make up"
