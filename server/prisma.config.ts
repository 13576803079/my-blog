/**
 * Prisma 配置文件（Prisma v7 要求）
 *
 * 数据库连接 URL 从这里传递，不再写在 schema.prisma 的 datasource 里。
 * 迁移命令也会从这里读取连接信息。
 */
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  // 数据源配置：指定 SQLite 数据库文件路径
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:../../dev.db',
  },
});
