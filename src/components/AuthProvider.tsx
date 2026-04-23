/**
 * 认证上下文提供者
 *
 * NextAuth 的 SessionProvider 是一个客户端组件，
 * 它的作用是把 session 数据通过 React Context 传递给所有子组件。
 *
 * 为什么需要这个包装？
 * - 根布局 (layout.tsx) 是服务端组件，不能直接用 SessionProvider
 * - 所以我们创建这个客户端组件作为中间层
 * - 子组件就可以用 useSession() 获取登录状态了
 *
 * 这是 Next.js App Router 中使用 NextAuth 的标准模式。
 */

"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
