#!/bin/bash
# 博客一键部署脚本（在本地 Mac 上运行）
#
# 使用方法：
#   ./scripts/deploy.sh            # 部署前端 + 后端
#   ./scripts/deploy.sh frontend   # 只部署前端
#   ./scripts/deploy.sh backend    # 只部署后端

set -e

# ===== 配置 =====
SERVER="root@45.78.235.113"
REMOTE_DIR="~/my-blog"
FRONTEND_DIR="$(cd "$(dirname "$0")/.." && pwd)/frontend"
API_URL="http://45.78.235.113/api"
SITE_URL="http://45.78.235.113"

# ===== 颜色 =====
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
info()  { echo -e "${GREEN}[1/...]${NC} $1"; }

# ===== 部署前端 =====
deploy_frontend() {
  echo ""
  echo "===== 部署前端 ====="

  info "本地构建 Next.js..."
  cd "$FRONTEND_DIR"
  NEXT_PUBLIC_API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$SITE_URL npm run build

  info "打包构建产物..."
  tar czf /tmp/frontend-next.tar.gz .next

  info "上传到服务器..."
  scp /tmp/frontend-next.tar.gz "$SERVER:$REMOTE_DIR/frontend/"

  info "服务器端解压并重启..."
  ssh "$SERVER" "cd $REMOTE_DIR/frontend && tar xzf frontend-next.tar.gz && rm -f frontend-next.tar.gz && pm2 restart blog-web"

  echo -e "${GREEN}✓ 前端部署完成${NC}"
}

# ===== 部署后端 =====
deploy_backend() {
  echo ""
  echo "===== 部署后端 ====="

  info "先推送代码到 Git（确保服务器能拉到最新代码）..."
  cd "$(cd "$(dirname "$0")/.." && pwd)"
  if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}检测到未提交的改动，是否提交并推送？[Y/n]${NC}"
    read -r answer
    if [ "$answer" != "n" ] && [ "$answer" != "N" ]; then
      git add -A
      git commit -m "auto deploy: $(date '+%Y-%m-%d %H:%M')"
      git push
    fi
  else
    git push
  fi

  info "服务器端拉取代码、构建、重启..."
  ssh "$SERVER" "cd $REMOTE_DIR && git pull && cd server && npm ci && npx prisma generate --schema=./prisma/schema.prisma && npm run build && pm2 restart blog-api"

  echo -e "${GREEN}✓ 后端部署完成${NC}"
}

# ===== 主流程 =====
case "${1:-all}" in
  frontend|f)
    deploy_frontend
    ;;
  backend|b)
    deploy_backend
    ;;
  all)
    deploy_backend
    deploy_frontend
    ;;
  *)
    echo "用法: $0 [all|frontend|backend]"
    echo "  all       部署前端 + 后端（默认）"
    echo "  frontend  只部署前端"
    echo "  backend   只部署后端"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  部署完成！访问 http://45.78.235.113${NC}"
echo -e "${GREEN}=========================================${NC}"
