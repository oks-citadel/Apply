.PHONY: help install dev build test lint format clean docker-up docker-down db-migrate db-seed

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Show this help message
	@echo '$(GREEN)Available commands:$(NC)'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo '$(GREEN)Installing dependencies...$(NC)'
	pnpm install

dev: ## Start development servers
	@echo '$(GREEN)Starting development servers...$(NC)'
	pnpm dev

build: ## Build all packages and services
	@echo '$(GREEN)Building all packages...$(NC)'
	pnpm build

test: ## Run all tests
	@echo '$(GREEN)Running tests...$(NC)'
	pnpm test

test-unit: ## Run unit tests
	@echo '$(GREEN)Running unit tests...$(NC)'
	pnpm test:unit

test-integration: ## Run integration tests
	@echo '$(GREEN)Running integration tests...$(NC)'
	pnpm test:integration

test-e2e: ## Run e2e tests
	@echo '$(GREEN)Running e2e tests...$(NC)'
	pnpm test:e2e

lint: ## Lint all code
	@echo '$(GREEN)Linting code...$(NC)'
	pnpm lint

format: ## Format all code
	@echo '$(GREEN)Formatting code...$(NC)'
	pnpm format

format-check: ## Check code formatting
	@echo '$(GREEN)Checking code formatting...$(NC)'
	pnpm format:check

type-check: ## Run TypeScript type checking
	@echo '$(GREEN)Running type check...$(NC)'
	pnpm type-check

clean: ## Clean all build artifacts and node_modules
	@echo '$(GREEN)Cleaning build artifacts...$(NC)'
	pnpm clean
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +
	find . -name ".next" -type d -prune -exec rm -rf '{}' +
	find . -name "build" -type d -prune -exec rm -rf '{}' +
	find . -name "coverage" -type d -prune -exec rm -rf '{}' +

docker-up: ## Start Docker services
	@echo '$(GREEN)Starting Docker services...$(NC)'
	docker-compose up -d
	@echo '$(GREEN)Docker services started!$(NC)'
	@echo 'PostgreSQL: localhost:5432'
	@echo 'Redis: localhost:6379'
	@echo 'Elasticsearch: localhost:9200'
	@echo 'RabbitMQ: localhost:5672 (Management: localhost:15672)'

docker-down: ## Stop Docker services
	@echo '$(GREEN)Stopping Docker services...$(NC)'
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-clean: ## Remove Docker volumes and containers
	@echo '$(YELLOW)Removing Docker containers and volumes...$(NC)'
	docker-compose down -v
	docker system prune -f

db-migrate: ## Run database migrations
	@echo '$(GREEN)Running database migrations...$(NC)'
	pnpm db:migrate

db-seed: ## Seed database with sample data
	@echo '$(GREEN)Seeding database...$(NC)'
	pnpm db:seed

db-reset: ## Reset database (drop, migrate, seed)
	@echo '$(YELLOW)Resetting database...$(NC)'
	docker-compose down postgres
	docker volume rm job-apply-platform_postgres_data || true
	docker-compose up -d postgres
	sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed

setup: ## Initial project setup
	@echo '$(GREEN)Setting up project...$(NC)'
	cp .env.example .env
	$(MAKE) install
	$(MAKE) docker-up
	sleep 10
	$(MAKE) db-migrate
	@echo '$(GREEN)Setup complete! Run "make dev" to start development.$(NC)'

verify: ## Verify installation and setup
	@echo '$(GREEN)Verifying setup...$(NC)'
	@command -v node >/dev/null 2>&1 || { echo "Node.js is not installed"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "pnpm is not installed"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "Docker is not installed"; exit 1; }
	@echo '$(GREEN)All prerequisites are installed!$(NC)'
	@node --version
	@pnpm --version
	@docker --version
