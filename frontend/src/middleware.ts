/**
 * Next.js 中间件 - 路由守卫
 *
 * 替代 NextAuth 的 withAuth，改为检查 cookie 中的 token。
 * middleware 运行在服务端，无法访问 localStorage，
 * 所以登录时会同时设置一个 cookie 作为中间件的判断依据。
 *
 * 逻辑：
 * 1. 用户访问需要登录的页面（/create, /dashboard 等）
 * 2. 中间件检查请求中是否有名为 "token" 的 cookie
 * 3. 没有 cookie → 重定向到 /login
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 从请求的 cookie 中读取 token
  const token = request.cookies.get("token")?.value;

  // 如果没有 token，重定向到登录页
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 有 token，放行请求
  return NextResponse.next();
}

// 配置哪些路径需要登录才能访问
export const config = {
  matcher: [
    // 文章创建和编辑页面需要登录
    "/create/:path*",
    "/edit/:path*",
    "/dashboard/:path*",
    // 个人资料编辑需要登录
    "/profile/:path*",
  ],
};
