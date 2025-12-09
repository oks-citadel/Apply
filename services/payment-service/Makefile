.PHONY: help install dev build start test lint format clean docker-build docker-up docker-down migration-generate migration-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	pnpm install

dev: ## Start development server
	pnpm run start:dev

build: ## Build for production
	pnpm run build

start: ## Start production server
	pnpm run start:prod

test: ## Run tests
	pnpm run test

test-cov: ## Run tests with coverage
	pnpm run test:cov

test-e2e: ## Run e2e tests
	pnpm run test:e2e

lint: ## Lint code
	pnpm run lint

format: ## Format code
	pnpm run format

clean: ## Clean build artifacts
	rm -rf dist node_modules coverage logs

docker-build: ## Build Docker image
	docker build -t payment-service:latest .

docker-up: ## Start services with Docker Compose
	docker-compose up -d

docker-down: ## Stop services with Docker Compose
	docker-compose down

docker-logs: ## View Docker Compose logs
	docker-compose logs -f

migration-generate: ## Generate a new migration (use NAME=MigrationName)
	pnpm run migration:generate -- src/migrations/$(NAME)

migration-run: ## Run database migrations
	pnpm run migration:run

migration-revert: ## Revert last migration
	pnpm run migration:revert

db-reset: ## Reset database (WARNING: deletes all data)
	docker-compose down -v
	docker-compose up -d postgres
	sleep 5
	pnpm run migration:run
