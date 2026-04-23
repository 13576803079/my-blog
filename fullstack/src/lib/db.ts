/**
 * Prisma 数据库客户端
 *
 * 为什么用 globalThis？
 * Next.js 开发环境下会频繁热重载，如果每次都 new PrismaClient()
 * 会创建大量数据库连接，最终耗尽连接池。
 * 把客户端挂到 globalThis 上，确保整个应用只创建一个实例。
 *
 * Prisma v7+ 变化：
 * 不再使用 schema 里的 datasource url 自动连接数据库，
 * 需要显式创建 adapter 并传入连接信息。
 */

import { PrismaClient } from "@/generated/prisma/client";
// Prisma v7+ 的 SQLite 适配器
import { PrismaLibSql } from "@prisma/adapter-libsql";

// 声明全局变量类型，TypeScript 才不会报错
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // 创建 SQLite 适配器，传入数据库连接地址
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
}

// 如果全局已经有了就用现有的，没有就新建一个
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 开发环境下把实例挂到 global 上，防止热重载时重复创建
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
