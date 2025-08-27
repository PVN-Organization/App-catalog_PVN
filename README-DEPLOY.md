# Hướng dẫn Deploy Catalog App

## Cấu trúc file deploy

- `Dockerfile` - Cấu hình build Docker image
- `nginx.conf` - Cấu hình Nginx server
- `docker-compose.yml` - Docker Compose cho development
- `docker-compose.prod.yml` - Docker Compose cho production
- `.github/workflows/deploy.yml` - GitHub Actions CI/CD
- `deploy.sh` - Script deploy thủ công
- `.dockerignore` - Loại trừ file không cần thiết

## Deploy Local

### 1. Build và chạy với Docker Compose

```bash
# Build và chạy
docker-compose up --build

# Chạy ở background
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down
```

### 2. Build và chạy với Docker trực tiếp

```bash
# Build image
docker build -t catalog-app .

# Chạy container
docker run -d --name catalog-app -p 10002:10002 catalog-app

# Xem logs
docker logs catalog-app

# Dừng và xóa container
docker stop catalog-app && docker rm catalog-app
```

### 3. Sử dụng script deploy

```bash
# Deploy với tag latest
./deploy.sh

# Deploy với tag cụ thể
./deploy.sh v1.0.0
```

## Deploy Production với GitHub Actions

### 1. Cấu hình Secrets

Thêm các secrets sau vào GitHub repository:

- `HOST` - IP hoặc domain của server
- `USERNAME` - Username SSH
- `SSH_KEY` - Private key SSH
- `PORT` - Port SSH (thường là 22)

### 2. Workflow tự động

Khi push code lên branch `main` hoặc `master`:

1. **Test**: Chạy test và build
2. **Build & Push**: Build Docker image và push lên GitHub Container Registry
3. **Deploy**: SSH vào server và deploy container mới

### 3. Manual trigger

Có thể trigger workflow thủ công từ GitHub Actions tab.

## Cấu hình Server

### 1. Cài đặt Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Cài đặt Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Cấu hình Firewall

```bash
# Mở port 10002
sudo ufw allow 10002

# Hoặc với iptables
sudo iptables -A INPUT -p tcp --dport 10002 -j ACCEPT
```

## Monitoring và Logs

### 1. Xem logs container

```bash
# Logs real-time
docker logs -f catalog-app

# Logs với timestamp
docker logs -f --timestamps catalog-app

# Logs từ thời điểm cụ thể
docker logs --since="2024-01-01T00:00:00" catalog-app
```

### 2. Health check

```bash
# Kiểm tra health endpoint
curl http://localhost:10002/health

# Kiểm tra container status
docker ps
docker inspect catalog-app
```

### 3. Resource monitoring

```bash
# Xem resource usage
docker stats catalog-app

# Xem disk usage
docker system df
```

## Troubleshooting

### 1. Container không start

```bash
# Xem logs
docker logs catalog-app

# Kiểm tra port conflict
netstat -tulpn | grep 10002

# Restart container
docker restart catalog-app
```

### 2. Build fail

```bash
# Xóa cache
docker builder prune

# Build với no-cache
docker build --no-cache -t catalog-app .
```

### 3. Permission issues

```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER

# Restart docker service
sudo systemctl restart docker
```

## Backup và Restore

### 1. Backup container

```bash
# Export container
docker export catalog-app > catalog-app-backup.tar

# Save image
docker save catalog-app > catalog-app-image.tar
```

### 2. Restore container

```bash
# Import container
docker import catalog-app-backup.tar catalog-app:backup

# Load image
docker load < catalog-app-image.tar
```

## Security

### 1. Update base images

```bash
# Pull latest base images
docker pull node:18-alpine
docker pull nginx:alpine

# Rebuild với base images mới
docker-compose build --no-cache
```

### 2. Scan vulnerabilities

```bash
# Sử dụng Docker Scout (nếu có)
docker scout cves catalog-app

# Hoặc sử dụng Trivy
trivy image catalog-app
```

## Performance Optimization

### 1. Multi-stage build

Dockerfile đã sử dụng multi-stage build để giảm kích thước image.

### 2. Resource limits

Docker Compose production đã cấu hình resource limits.

### 3. Caching

- Sử dụng Docker layer caching
- GitHub Actions cache cho npm dependencies
- Nginx caching cho static files
