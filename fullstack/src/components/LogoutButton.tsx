/**
 * 登出按钮组件
 *
 * 为什么不直接把登出逻辑写在 Navbar 里？
 * 因为 NextAuth 的 signOut() 是客户端函数（需要操作浏览器 cookie），
 * 而 Navbar 是服务端组件（没有 "use client"）。
 *
 * 解决方案：
 * - Navbar 保持为服务端组件（可以直接获取 session）
 * - 交互部分（登出按钮）抽成单独的客户端组件
 *
 * 这是 Next.js App Router 的常见模式：
 * 服务端组件做数据获取，客户端组件做用户交互。
 */

"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  async function handleLogout() {
    // 调用 NextAuth 的客户端登出方法
    // 登出后会自动清除 session cookie 并跳转到首页
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
    >
      登出
    </button>
  );
}
