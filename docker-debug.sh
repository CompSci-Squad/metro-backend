#!/bin/bash

echo "=== Construction Monitoring - Docker Debug ==="
echo ""

# Stop and remove all containers
echo "1. Stopping all containers..."
docker compose down

# Remove old volumes
echo "2. Removing old volumes..."
docker volume rm backend-pi_postgres_data 2>/dev/null || true
docker volume rm backend-pi_localstack_data 2>/dev/null || true

# Clean Docker system
echo "3. Cleaning Docker system..."
docker system prune -f

# Rebuild without cache
echo "4. Building backend image..."
docker compose build --no-cache backend

# Start services one by one
echo "5. Starting PostgreSQL..."
docker compose up -d postgres

echo "6. Waiting for PostgreSQL to be healthy..."
sleep 10

echo "7. Starting LocalStack..."
docker compose up -d localstack

echo "8. Waiting for LocalStack to be healthy..."
sleep 10

echo "9. Initializing LocalStack (creating bucket)..."
docker compose up localstack-init

echo "10. Starting Backend..."
docker compose up -d backend

echo ""
echo "=== Done! Checking container status ==="
docker compose ps

echo ""
echo "=== View logs with: ==="
echo "docker compose logs -f backend"
echo "docker compose logs -f postgres"
