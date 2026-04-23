/**
 * Prisma 数据库模块（全局）
 *
 * 使用 @Global() 装饰器，注册后所有模块都可以注入 PrismaClient，
 * 不需要在每个模块单独 import PrismaModule。
 *
 * Prisma v7 使用 "client" 引擎，需要通过 adapter 连接数据库。
 * 这里使用 @prisma/adapter-better-sqlite3 适配器连接 SQLite。
 * 数据库文件路径从环境变量 DATABASE_URL 读取（格式: file:./path/to/db）。
 */
import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        // 从环境变量获取数据库路径，去掉 "file:" 前缀
        // .env 中配置的是 "file:../../dev.db"，指向项目根目录的 dev.db
        const dbUrl = process.env.DATABASE_URL || 'file:../../dev.db';
        const dbPath = dbUrl.replace(/^file:/, '');

        // 创建 better-sqlite3 适配器
        const adapter = new PrismaBetterSqlite3({ url: dbPath });

        // 创建 PrismaClient 并传入适配器
        return new PrismaClient({ adapter });
      },
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}
