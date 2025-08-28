# Hướng dẫn cấu hình GitHub Actions cho Self-hosted Runner

## Tổng quan

Dự án này sử dụng GitHub Actions với self-hosted runner để triển khai tự động lên server vật lý `171.244.49.215:10002`. Workflow được thiết kế để chạy trên runner `ATM-5500721-01`.

## Cấu trúc Workflows

### 1. Deploy Workflow (`.github/workflows/deploy.yml`)

**Trigger:**
- Push lên branch `main` hoặc `master`
- Pull request
- Manual trigger với tùy chọn environment

**Jobs:**
- `test`: Chạy trên GitHub-hosted runner để test code
- `build-and-deploy`: Chạy trên self-hosted runner để build và deploy

**Features:**
- ✅ Backup tự động trước khi deploy
- ✅ Health check và rollback tự động
- ✅ Cleanup image cũ
- ✅ Logging chi tiết
- ✅ Zero-downtime deployment

### 2. Health Check Workflow (`.github/workflows/health-check.yml`)

**Trigger:**
- Schedule: Mỗi 15 phút
- Manual trigger với tùy chọn loại check

**Features:**
- ✅ Basic health check
- ✅ Comprehensive monitoring
- ✅ Performance monitoring
- ✅ Auto-restart khi unhealthy

## Cấu hình Repository

### 1. Không cần Secrets

Workflow này được thiết kế để chạy hoàn toàn trên self-hosted runner, không cần cấu hình secrets cho SSH hoặc container registry.

### 2. Self-hosted Runner Requirements

Runner `ATM-5500721-01` cần có:

#### Software cần thiết:
```bash
# Docker và Docker Compose
docker --version
docker-compose --version

# Curl cho health checks
curl --version

# Git để checkout code
git --version

# Basic utils
bc --version  # Cho performance calculations
```

#### Permissions:
```bash
# User phải có quyền chạy Docker
sudo usermod -aG docker $USER

# Khởi động lại shell hoặc logout/login
```

#### Directory structure trên server:
```
/tmp/catalog-backups/     # Backup directory
/var/log/catalog-app/     # Application logs
```

### 3. Firewall Configuration

```bash
# Mở port 10002 cho application
sudo ufw allow 10002

# Hoặc với iptables
sudo iptables -A INPUT -p tcp --dport 10002 -j ACCEPT
```

## Cách sử dụng

### 1. Automatic Deployment

```bash
# Push code lên main branch
git add .
git commit -m "feat: new feature"
git push origin main

# Workflow sẽ tự động chạy
```

### 2. Manual Deployment

1. Vào GitHub repository
2. Chọn tab "Actions"
3. Chọn workflow "Deploy Catalog App to Production"
4. Click "Run workflow"
5. Chọn environment (production/staging)

### 3. Health Check Manual

1. Vào tab "Actions"
2. Chọn workflow "Health Check and Monitoring"
3. Click "Run workflow"
4. Chọn loại check (basic/comprehensive/performance)

## Monitoring và Debugging

### 1. Xem Workflow Logs

```
GitHub Repository → Actions → Chọn workflow run → Xem logs
```

### 2. Kiểm tra trên Server

```bash
# Kiểm tra container status
docker ps --filter name=catalog-app

# Xem logs application
docker logs catalog-app

# Xem resource usage
docker stats catalog-app

# Health check manual
curl http://localhost:10002/health
curl http://171.244.49.215:10002/health
```

### 3. Useful Commands trên Server

```bash
# Restart application
docker restart catalog-app

# View recent logs
docker logs catalog-app --tail=50 -f

# Check container details
docker inspect catalog-app

# Manual deploy using script
./scripts/deploy-selfhosted.sh production

# Rollback using script
./scripts/deploy-selfhosted.sh rollback

# Cleanup resources
./scripts/deploy-selfhosted.sh cleanup
```

## Troubleshooting

### 1. Workflow không chạy

**Kiểm tra:**
- Runner `ATM-5500721-01` có online không?
- Repository có được cấu hình đúng self-hosted runner không?

**Giải pháp:**
```bash
# Trên server, kiểm tra runner status
sudo systemctl status actions.runner.pvn-organization-app-catalog_pvn.ATM-5500721-01

# Restart runner nếu cần
sudo systemctl restart actions.runner.pvn-organization-app-catalog_pvn.ATM-5500721-01
```

### 2. Build/Deploy thất bại

**Kiểm tra:**
- Docker daemon có chạy không?
- Disk space có đủ không?
- Port 10002 có bị conflict không?

**Giải pháp:**
```bash
# Kiểm tra Docker
sudo systemctl status docker
docker info

# Kiểm tra disk space
df -h

# Kiểm tra port
netstat -tulpn | grep 10002

# Manual cleanup
docker system prune -af
```

### 3. Health Check thất bại

**Kiểm tra:**
- Application có start thành công không?
- Network connectivity
- Firewall rules

**Giải pháp:**
```bash
# Kiểm tra container logs
docker logs catalog-app

# Test local health endpoint
curl -v http://localhost:10002/health

# Test external access
curl -v http://171.244.49.215:10002/health

# Check nginx config
docker exec catalog-app nginx -t
```

### 4. Rollback

**Automatic rollback:**
- Workflow sẽ tự động rollback nếu health check thất bại

**Manual rollback:**
```bash
# Sử dụng script
./scripts/deploy-selfhosted.sh rollback

# Hoặc manual
docker stop catalog-app
docker rm catalog-app
docker load < /tmp/catalog-backups/[backup-name].tar
docker run -d --name catalog-app --restart unless-stopped -p 10002:10002 [backup-image]
```

## Best Practices

### 1. Development Workflow

```bash
# Tạo feature branch
git checkout -b feature/new-feature

# Develop và test local
npm run dev

# Push và tạo PR
git push origin feature/new-feature

# Merge vào main sau review
```

### 2. Production Deployment

- ✅ Luôn test trên local trước
- ✅ Kiểm tra logs sau deploy
- ✅ Monitor health check
- ✅ Có plan rollback

### 3. Monitoring

- ✅ Check GitHub Actions regularly
- ✅ Monitor server resources
- ✅ Review application logs
- ✅ Set up alerts nếu cần

## Performance Optimization

### 1. Build Cache

Workflow đã được tối ưu với:
- Docker layer caching
- Node.js dependency caching
- Reuse compiled assets

### 2. Deployment Speed

- Multi-stage Docker build
- Parallel testing và deployment
- Efficient rollback mechanism

### 3. Resource Management

- Automatic cleanup old images
- Log rotation
- Resource monitoring

## Security Considerations

### 1. Network Security

- ✅ Firewall configured
- ✅ Only necessary ports open
- ✅ Internal communication secured

### 2. Container Security

- ✅ Non-root user trong container
- ✅ Security headers trong nginx
- ✅ Regular base image updates

### 3. Access Control

- ✅ GitHub repository permissions
- ✅ Runner access control
- ✅ Server access management
