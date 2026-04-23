/**
 * Next.js 中间件 - 路由守卫
 *
 * 中间件在请求到达页面之前执行，适合做：
 * - 登录状态检查（未登录重定向到登录页）
 * - 权限控制
 * - 日志记录
 *
 * 这里的逻辑：
 * 1. 用户访问需要登录的页面（/create, /dashboard）
 * 2. 中间件检查是否有有效的 session token
 * 3. 没有就重定向到 /login
 *
 * matcher 配置决定哪些路径需要经过中间件。
 */

import { withAuth } from "next-auth/middleware";

// withAuth 是 NextAuth 提供的中间件封装，自动处理 token 验证
export default withAuth({
  // 未登录时跳转到哪个页面
  pages: {
    signIn: "/login",
  },
});

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
