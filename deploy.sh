#!/bin/bash
# 博客系统部署脚本
#
# 使用方法：
#   ./deploy.sh           # 首次部署
#   ./deploy.sh update    # 更新代码后重新部署
#   ./deploy.sh backup    # 备份数据库

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 检查 Docker
command -v docker >/dev/null 2>&1 || error "请先安装 Docker: curl -fsSL https://get.docker.com | sh"
command -v docker compose >/dev/null 2>&1 || error "请先安装 Docker Compose"

# 检查 .env 文件
if [ ! -f .env ]; then
    warn ".env 文件不存在，正在从模板创建..."
    cp .env.example .env
    error "请编辑 .env 文件，填写 SERVER_IP 和 JWT_SECRET 后重新运行"
fi

# 生成随机 JWT_SECRET（如果还是默认值）
if grep -q "change-this-to-a-random-secret" .env; then
    info "正在生成 JWT 密钥..."
    SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/change-this-to-a-random-secret/$SECRET/" .env
    rm -f .env.bak
    info "JWT 密钥已自动生成"
fi

# 创建数据目录
mkdir -p data

case "${1:-deploy}" in
    deploy)
        info "开始构建并启动服务..."
        docker compose up -d --build
        info "等待服务启动..."
        sleep 5
        docker compose ps
        info "========================================="
        info "部署完成！"
        info "访问 http://$(grep SERVER_IP .env | cut -d= -f2) 查看博客"
        info "========================================="
        ;;

    update)
        info "拉取最新代码..."
        git pull
        info "重新构建并启动..."
        docker compose up -d --build
        info "更新完成！"
        ;;

    stop)
        info "停止所有服务..."
        docker compose down
        info "服务已停止"
        ;;

    logs)
        docker compose logs -f
        ;;

    backup)
        BACKUP_DIR="backups"
        mkdir -p "$BACKUP_DIR"
        BACKUP_FILE="$BACKUP_DIR/dev-db-$(date +%Y%m%d-%H%M%S).db"
        if [ -f data/dev.db ]; then
            cp data/dev.db "$BACKUP_FILE"
            info "数据库已备份到 $BACKUP_FILE"
        else
            error "数据库文件 data/dev.db 不存在"
        fi
        ;;

    status)
        docker compose ps
        echo ""
        info "磁盘使用："
        du -sh data/ 2>/dev/null || echo "  data/ 目录不存在"
        du -sh backups/ 2>/dev/null || echo "  backups/ 目录不存在"
        ;;

    *)
        echo "用法: $0 {deploy|update|stop|logs|backup|status}"
        exit 1
        ;;
esac
