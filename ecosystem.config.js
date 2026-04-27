/**
 * PM2 进程管理配置
 *
 * 管理前后端两个进程：
 *   blog-api  - NestJS 后端（端口 4000）
 *   blog-web  - Next.js 前端（端口 3000）
 *
 * 使用方法：
 *   pm2 start ecosystem.config.js   # 启动所有进程
 *   pm2 stop all                    # 停止所有进程
 *   pm2 restart all                 # 重启所有进程
 *   pm2 logs                        # 查看日志
 *   pm2 monit                       # 监控面板
 */
module.exports = {
  apps: [
    {
      name: 'blog-api',
      cwd: './server',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: 'file:../../dev.db',
        JWT_SECRET: 'change-this-to-a-random-secret',
      },
    },
    {
      name: 'blog-web',
      cwd: './frontend',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
