# My Blog - 部署文档

## 服务器信息

| 项目 | 值 |
|------|------|
| 云服务商 | 火山引擎 |
| 公网 IP | 45.78.235.113 |
| 操作系统 | Ubuntu 24.04 LTS |
| 内存 | 2GB |
| 磁盘 | 40GB |
| Node.js | v22.22.0 |
| 登录方式 | `ssh root@45.78.235.113` |

## 架构

```
用户浏览器 → Nginx(:80)
              ├── /api/ → NestJS(:4000) 后端
              └── /      → Next.js(:3000) 前端
```

- **Nginx** 监听 80 端口，统一入口
- **Next.js** 前端运行在 3000 端口（PM2 管理）
- **NestJS** 后端运行在 4000 端口（PM2 管理）
- **SQLite** 数据库位于 `~/my-blog/dev.db`
- 只开放 **80 端口**，4000 和 3000 不对外暴露

## 项目目录结构（服务器上）

```
~/my-blog/
├── dev.db                     # SQLite 数据库
├── ecosystem.config.js        # PM2 进程管理配置
├── deploy/
│   └── nginx/
│       └── default.conf       # Nginx 反向代理配置
├── frontend/                  # Next.js 前端
│   ├── .env.production        # 生产环境变量（构建时读取）
│   ├── .next/                 # 构建产物
│   ├── node_modules/
│   └── ...
├── server/                    # NestJS 后端
│   ├── dist/                  # 编译产物
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env                   # 后端环境变量
│   ├── node_modules/
│   └── ...
└── fullstack/                 # 纯 Next.js 版本（仅开发用）
```

## 关键配置文件

### 1. Nginx 配置

路径：`/etc/nginx/sites-available/my-blog`

```nginx
server {
    listen 80;
    server_name _;
    client_max_body_size 5M;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 前端环境变量

路径：`~/my-blog/frontend/.env.production`

```env
NEXT_PUBLIC_API_URL=http://45.78.235.113/api
NEXT_PUBLIC_SITE_URL=http://45.78.235.113
```

> **重要**：`NEXT_PUBLIC_*` 变量在 `npm run build` 时内联到代码中，修改后必须重新构建。

### 3. 后端环境变量

路径：`~/my-blog/server/.env`

```env
DATABASE_URL="file:../../dev.db"
JWT_SECRET="my-blog-jwt-secret-change-in-production"
PORT=4000
```

### 4. PM2 配置

路径：`~/my-blog/ecosystem.config.js`

管理两个进程：
- `blog-api` — NestJS 后端，入口 `server/dist/src/main.js`
- `blog-web` — Next.js 前端，命令 `next start`

---

## 首次部署（完整流程）

> 以下是从零开始部署的完整步骤，已执行完毕。记录供参考。

### 第 1 步：服务器环境准备

```bash
# 安装 Nginx
sudo apt update && sudo apt install -y nginx

# 安装 PM2
npm install -g pm2

# 创建 swap（防止内存不足）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 第 2 步：上传代码

```bash
# 在本地 Mac 执行
git clone YOUR_REPO_URL ~/my-blog   # 或 scp 上传
```

### 第 3 步：构建后端（在服务器上）

```bash
cd ~/my-blog/server
npm ci
npx prisma generate --schema=./prisma/schema.prisma
npm run build

# 初始化数据库（首次部署）
npx prisma db push --schema=./prisma/schema.prisma
```

### 第 4 步：构建前端（在本地 Mac 上）

> 前端构建建议在本地完成（服务器 2G 内存构建慢），然后上传。

```bash
# 在本地 Mac 执行
cd /Users/wangying/Desktop/my-blog/frontend
NEXT_PUBLIC_API_URL=http://45.78.235.113/api NEXT_PUBLIC_SITE_URL=http://45.78.235.113 npm run build

# 打包并上传
tar czf /tmp/frontend-next.tar.gz .next
scp /tmp/frontend-next.tar.gz root@45.78.235.113:~/my-blog/frontend/
```

```bash
# 在服务器上解压
cd ~/my-blog/frontend
tar xzf frontend-next.tar.gz
rm -f frontend-next.tar.gz

# 安装运行时依赖
npm ci
```

### 第 5 步：配置 Nginx

```bash
# 在服务器上执行
sudo cp ~/my-blog/deploy/nginx/default.conf /etc/nginx/sites-available/my-blog
sudo ln -sf /etc/nginx/sites-available/my-blog /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### 第 6 步：启动服务

```bash
cd ~/my-blog
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 第 7 步：开放防火墙

火山引擎控制台 → 云服务器 → 安全组 → 入方向规则：
- 协议：TCP，端口：80，来源：0.0.0.0/0

---

## 日常更新部署

### 更新前端

```bash
# === 本地 Mac 执行 ===

# 1. 本地构建（5 秒）
cd /Users/wangying/Desktop/my-blog/frontend
NEXT_PUBLIC_API_URL=http://45.78.235.113/api NEXT_PUBLIC_SITE_URL=http://45.78.235.113 npm run build

# 2. 打包上传（15MB，几秒钟）
tar czf /tmp/frontend-next.tar.gz .next
scp /tmp/frontend-next.tar.gz root@45.78.235.113:~/my-blog/frontend/

# === 服务器执行 ===

# 3. 解压并重启（SSH 到服务器）
cd ~/my-blog/frontend
tar xzf frontend-next.tar.gz
rm -f frontend-next.tar.gz
pm2 restart blog-web
```

### 更新后端

```bash
# === 服务器上执行 ===

cd ~/my-blog

# 1. 拉取最新代码
git pull

# 2. 安装依赖（如果 package.json 有变化）
cd server
npm ci

# 3. 重新生成 Prisma Client（如果 schema 有变化）
npx prisma generate --schema=./prisma/schema.prisma

# 4. 如果有数据库变更，同步表结构
npx prisma db push --schema=./prisma/schema.prisma

# 5. 重新构建
npm run build

# 6. 重启
pm2 restart blog-api
```

### 同时更新前后端

```bash
# 本地 Mac
cd /Users/wangying/Desktop/my-blog/frontend
NEXT_PUBLIC_API_URL=http://45.78.235.113/api NEXT_PUBLIC_SITE_URL=http://45.78.235.113 npm run build
tar czf /tmp/frontend-next.tar.gz .next
scp /tmp/frontend-next.tar.gz root@45.78.235.113:~/my-blog/frontend/

# 服务器
cd ~/my-blog
git pull
cd server && npm ci && npx prisma generate --schema=./prisma/schema.prisma && npm run build
cd ../frontend && tar xzf frontend-next.tar.gz && rm -f frontend-next.tar.gz
pm2 restart all
```

---

## 常用维护命令

### PM2 进程管理

```bash
pm2 status              # 查看进程状态
pm2 logs                # 查看所有日志（实时）
pm2 logs blog-api       # 只看后端日志
pm2 logs blog-web       # 只看前端日志
pm2 restart all         # 重启所有
pm2 restart blog-api    # 只重启后端
pm2 restart blog-web    # 只重启前端
pm2 stop all            # 停止所有
pm2 monit               # 实时监控面板（CPU/内存）
```

### Nginx

```bash
sudo nginx -t                   # 测试配置是否正确
sudo systemctl restart nginx    # 重启 Nginx
sudo systemctl status nginx     # 查看状态
```

### 数据库

```bash
# 备份
cp ~/my-blog/dev.db ~/my-blog/backups/dev-db-$(date +%Y%m%d).db

# 在线查看数据库
cd ~/my-blog/server && npx prisma studio --port 5555
# 然后在本地通过 SSH 隧道访问：
# 本地执行: ssh -L 5555:localhost:5555 root@45.78.235.113
# 浏览器打开: http://localhost:5555
```

### 数据库迁移（修改了 schema.prisma 后）

```bash
cd ~/my-blog/server
npx prisma db push --schema=./prisma/schema.prisma
```

---

## 故障排查

### 网站打不开

```bash
# 1. 检查进程是否在运行
pm2 status

# 2. 检查 Nginx 是否在运行
sudo systemctl status nginx

# 3. 检查端口是否被占用
ss -tlnp | grep -E '80|3000|4000'
```

### API 报错

```bash
# 查看后端日志
pm2 logs blog-api --lines 50

# 直接测试后端
curl http://127.0.0.1:4000/posts

# 测试 Nginx 转发
curl http://127.0.0.1/api/posts
```

### 前端白屏或报错

```bash
# 查看前端日志
pm2 logs blog-web --lines 50

# 检查构建产物是否存在
ls ~/my-blog/frontend/.next/
```

### 内存不足

```bash
# 查看内存使用
free -h

# 查看 swap 是否启用
swapon --show

# 如果没有 swap，创建
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 需要重新构建前端

在本地 Mac 构建最快（5 秒），步骤见「更新前端」章节。

---

## 注意事项

1. **前端环境变量**：`NEXT_PUBLIC_*` 在构建时内联，修改后必须重新构建才能生效
2. **后端环境变量**：修改 `server/.env` 后重启即可（`pm2 restart blog-api`）
3. **图片上传**：文件保存在 `frontend/public/uploads/`，需要确保目录存在且有写权限
4. **数据库备份**：建议定期备份 `dev.db` 文件
5. **服务器重启后**：PM2 会自动启动（已通过 `pm2 startup` 配置）
6. **不要在服务器上构建前端**：2G 内存太慢，在本地 Mac 构建后上传即可
