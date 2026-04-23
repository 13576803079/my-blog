/**
 * 认证上下文提供者（入口组件）
 *
 * 替代之前的 NextAuth SessionProvider。
 * 包裹整个应用，让所有客户端组件都能通过 useAuth() 获取登录状态。
 *
 * 用法：
 *   // 在需要认证的组件中
 *   import { useAuth } from '@/components/AuthProvider'
 *   const { user, login, logout } = useAuth()
 */

"use client";

import { AuthProvider as AuthContextProvider } from "@/lib/auth-context";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}

// 重新导出 useAuth hook，方便其他组件使用
export { useAuth } from "@/lib/auth-context";
