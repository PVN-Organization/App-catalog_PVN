#!/bin/bash

# Deploy script for Catalog App
# Usage: ./deploy.sh [image_tag]

set -e

# Configuration
CONTAINER_NAME="catalog-app"
IMAGE_NAME="catalog-app"
PORT="10002"
NETWORK_NAME="catalog-network"

# Get image tag from argument or use latest
IMAGE_TAG=${1:-latest}
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "🚀 Starting deployment of ${FULL_IMAGE_NAME}..."

# Create network if it doesn't exist
echo "📡 Creating Docker network..."
docker network create ${NETWORK_NAME} 2>/dev/null || true

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

# Pull latest image (if using registry)
if [[ $IMAGE_NAME == *"/"* ]]; then
    echo "📥 Pulling latest image..."
    docker pull ${FULL_IMAGE_NAME}
fi

# Run new container
echo "🏃 Starting new container..."
docker run -d \
    --name ${CONTAINER_NAME} \
    --network ${NETWORK_NAME} \
    --restart unless-stopped \
    -p ${PORT}:${PORT} \
    -e NODE_ENV=production \
    ${FULL_IMAGE_NAME}

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Health check
echo "🏥 Performing health check..."
for i in {1..30}; do
    if curl -f http://localhost:${PORT}/health >/dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed after 30 attempts"
        docker logs ${CONTAINER_NAME}
        exit 1
    fi
    echo "⏳ Health check attempt $i/30..."
    sleep 2
done

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"
echo "📱 Application is running on http://localhost:${PORT}"
echo "🔍 Container logs: docker logs ${CONTAINER_NAME}"
