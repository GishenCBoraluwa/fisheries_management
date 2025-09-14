# ============================================================================
# MAKEFILE FOR EASY MANAGEMENT - Makefile
# ============================================================================

.PHONY: help build up down logs clean dev prod migrate seed backup restore

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build Docker images"
	@echo "  up        - Start production services"
	@echo "  down      - Stop all services"
	@echo "  dev       - Start development environment"
	@echo "  logs      - Show logs"
	@echo "  migrate   - Run database migrations"
	@echo "  seed      - Seed database with sample data"
	@echo "  clean     - Clean up Docker resources"
	@echo "  backup    - Backup database"
	@echo "  restore   - Restore database"

# Build images
build:
	docker-compose build --no-cache

# Start production environment
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Start development environment
dev:
	docker-compose -f docker-compose.dev.yml up --build

# Show logs
logs:
	docker-compose logs -f

# Run migrations
migrate:
	docker-compose run --rm migrator

# Seed database
seed:
	docker-compose exec app npm run db:seed

# Clean up Docker resources
clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Backup database
backup:
	docker-compose exec db pg_dump -U fisheries_user fisheries_db > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Restore database (usage: make restore file=backup.sql)
restore:
	docker-compose exec -T db psql -U fisheries_user fisheries_db < $(file)

# Health check
health:
	docker-compose exec app curl -f http://localhost:3000/api/v1/health

# Enter app container
shell:
	docker-compose exec app sh

# View real-time logs
tail:
	docker-compose logs -f app