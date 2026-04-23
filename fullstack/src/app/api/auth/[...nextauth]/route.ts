/**
 * NextAuth API 路由处理程序
 *
 * 这个文件是 NextAuth 的入口点。
 * 访问 /api/auth/* 的所有请求都会被 NextAuth 接管：
 *
 *   /api/auth/signin      → 登录页面
 *   /api/auth/signout     → 登出
 *   /api/auth/callback    → OAuth 回调（本项目不用）
 *   /api/auth/session     → 获取当前 session
 *
 * [...nextauth] 是 Next.js 的 catch-all 路由语法，
 * 表示匹配这个路径下的所有子路径。
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// 创建 NextAuth 处理函数，传入我们配置好的认证选项
const handler = NextAuth(authOptions);

// 导出 GET 和 POST 方法（Next.js App Router 的要求）
export { handler as GET, handler as POST };
