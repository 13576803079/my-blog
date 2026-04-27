# ===== 阶段 1：安装依赖 =====
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ===== 阶段 2：构建 =====
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建参数：注入前端环境变量（在 build 时内联到代码中）
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SITE_URL=http://localhost
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# ===== 阶段 3：生产运行 =====
# standalone 模式只包含最小化的 server.js 和必要的 node_modules
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# standalone 不包含静态资源和 public 目录，需要手动复制
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
