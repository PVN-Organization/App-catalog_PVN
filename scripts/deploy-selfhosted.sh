#!/bin/bash

# Self-hosted deployment script for Catalog App
# Usage: ./scripts/deploy-selfhosted.sh [environment] [version]

set -e

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
CONTAINER_NAME="catalog-app"
IMAGE_NAME="catalog-app"
PORT="10002"
SERVER_IP="171.244.49.215"
BACKUP_DIR="/tmp/catalog-backups"
LOG_DIR="/var/log/catalog-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        error "curl is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    success "Directories created"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        BACKUP_NAME="${CONTAINER_NAME}-backup-$(date '+%Y%m%d_%H%M%S')"
        
        log "Committing current container as ${BACKUP_NAME}..."
        docker commit "$CONTAINER_NAME" "$BACKUP_NAME" || {
            warning "Failed to commit container, continuing anyway..."
        }
        
        log "Saving backup to ${BACKUP_DIR}/${BACKUP_NAME}.tar..."
        docker save "$BACKUP_NAME" > "${BACKUP_DIR}/${BACKUP_NAME}.tar" || {
            warning "Failed to save backup, continuing anyway..."
        }
        
        success "Backup created: ${BACKUP_NAME}"
        echo "$BACKUP_NAME" > "${BACKUP_DIR}/latest_backup.txt"
    else
        log "No existing container found, skipping backup"
    fi
}

# Stop and remove existing container
stop_existing_container() {
    log "Stopping existing container..."
    
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop "$CONTAINER_NAME" || {
            error "Failed to stop container"
            return 1
        }
        success "Container stopped"
    else
        log "No running container found"
    fi
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker rm "$CONTAINER_NAME" || {
            error "Failed to remove container"
            return 1
        }
        success "Container removed"
    fi
}

# Build new image
build_image() {
    log "Building new Docker image..."
    
    if [ "$VERSION" != "latest" ]; then
        IMAGE_TAG="${IMAGE_NAME}-${VERSION}"
    else
        IMAGE_TAG="${IMAGE_NAME}-$(date '+%Y%m%d_%H%M%S')"
    fi
    
    docker build -t "$IMAGE_TAG" . || {
        error "Failed to build Docker image"
        return 1
    }
    
    success "Image built: $IMAGE_TAG"
    echo "$IMAGE_TAG" > "/tmp/latest_image.txt"
}

# Start new container
start_new_container() {
    log "Starting new container..."
    
    IMAGE_TAG=$(cat "/tmp/latest_image.txt" 2>/dev/null || echo "${IMAGE_NAME}:latest")
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        -p "${PORT}:${PORT}" \
        -e NODE_ENV="$ENVIRONMENT" \
        -e DEPLOY_VERSION="$VERSION" \
        -e DEPLOY_TIME="$(date '+%Y-%m-%d %H:%M:%S')" \
        -e SERVER_IP="$SERVER_IP" \
        -v "${LOG_DIR}:/var/log/nginx" \
        "$IMAGE_TAG" || {
        error "Failed to start container"
        return 1
    }
    
    success "Container started: $CONTAINER_NAME"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "http://localhost:${PORT}/health" >/dev/null 2>&1; then
            success "Health check passed!"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    # Stop failed container
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    
    # Load backup if available
    if [ -f "${BACKUP_DIR}/latest_backup.txt" ]; then
        BACKUP_NAME=$(cat "${BACKUP_DIR}/latest_backup.txt")
        if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.tar" ]; then
            log "Loading backup: $BACKUP_NAME"
            docker load < "${BACKUP_DIR}/${BACKUP_NAME}.tar"
            
            log "Starting backup container..."
            docker run -d \
                --name "$CONTAINER_NAME" \
                --restart unless-stopped \
                -p "${PORT}:${PORT}" \
                -e NODE_ENV="$ENVIRONMENT" \
                "$BACKUP_NAME"
            
            if health_check; then
                warning "Rollback completed successfully"
                return 0
            fi
        fi
    fi
    
    error "Rollback failed or no backup available"
    return 1
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check container status
    if ! docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "$CONTAINER_NAME"; then
        error "Container is not running"
        return 1
    fi
    
    # Check application response
    local response
    response=$(curl -s "http://localhost:${PORT}/health" 2>/dev/null || echo "")
    
    if [ "$response" = "healthy" ]; then
        success "Application is responding correctly"
    else
        error "Application health check failed. Response: $response"
        return 1
    fi
    
    # Check logs for errors
    local error_count
    error_count=$(docker logs "$CONTAINER_NAME" --since="1m" 2>&1 | grep -i error | wc -l)
    
    if [ "$error_count" -gt 0 ]; then
        warning "Found $error_count error(s) in recent logs"
        docker logs "$CONTAINER_NAME" --since="1m" --tail=10
    fi
    
    success "Deployment verification completed"
}

# Clean up old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove old images (keep latest 3)
    docker images --format "{{.Repository}}:{{.Tag}}" | grep "^${IMAGE_NAME}" | tail -n +4 | xargs -r docker rmi 2>/dev/null || true
    
    # Clean up old backups (keep latest 5)
    find "$BACKUP_DIR" -name "*.tar" -type f | sort -r | tail -n +6 | xargs -r rm -f
    
    # Prune unused Docker resources
    docker system prune -f --volumes
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment of Catalog App..."
    log "Environment: $ENVIRONMENT"
    log "Version: $VERSION"
    log "Server IP: $SERVER_IP"
    log "Port: $PORT"
    
    # Run deployment steps
    check_prerequisites
    setup_directories
    backup_current_deployment
    stop_existing_container
    
    if ! build_image; then
        error "Build failed"
        exit 1
    fi
    
    if ! start_new_container; then
        error "Failed to start container"
        rollback
        exit 1
    fi
    
    if ! health_check; then
        error "Health check failed"
        rollback
        exit 1
    fi
    
    if ! verify_deployment; then
        error "Deployment verification failed"
        rollback
        exit 1
    fi
    
    cleanup
    
    success "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Application URL: http://${SERVER_IP}:${PORT}"
    echo "🔍 Health check: http://${SERVER_IP}:${PORT}/health"
    echo "📊 Container: $CONTAINER_NAME"
    echo "🏷️ Version: $VERSION"
    echo "⏰ Deploy time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs: docker logs $CONTAINER_NAME"
    echo "  Check status: docker ps --filter name=$CONTAINER_NAME"
    echo "  Stop app: docker stop $CONTAINER_NAME"
    echo "  Restart app: docker restart $CONTAINER_NAME"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 [deploy|rollback|health|cleanup] [environment] [version]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Check application health"
        echo "  cleanup  - Clean up old resources"
        echo ""
        echo "Examples:"
        echo "  $0 deploy production v1.0.0"
        echo "  $0 rollback"
        echo "  $0 health"
        exit 1
        ;;
esac
