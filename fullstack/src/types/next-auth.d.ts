/**
 * NextAuth 类型扩展
 *
 * 默认情况下 NextAuth 的 User 和 Session 类型里没有 id 字段。
 * 这里通过模块扩展（module augmentation）把 id 加上去。
 *
 * 如果不做这个扩展，写 session.user.id 时 TypeScript 会报错。
 * 这是 NextAuth 自定义 JWT 内容时必须做的步骤。
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** 用户唯一 ID（从 JWT token 中获取） */
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** 用户唯一 ID（登录时从 user 对象写入） */
    id: string;
  }
}
