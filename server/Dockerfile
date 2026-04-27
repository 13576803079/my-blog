# 单阶段构建（后端需要 prisma CLI 做数据库迁移，保留完整依赖）
FROM node:22-alpine

# better-sqlite3 需要编译原生模块
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
COPY package.json package-lock.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

EXPOSE 4000

# 启动时先同步数据库表结构（首次会自动创建），然后启动服务
CMD ["sh", "-c", "npx prisma db push --schema=./prisma/schema.prisma --skip-generate 2>/dev/null; node dist/main.js"]
