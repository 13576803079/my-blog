/**
 * 导航栏组件
 *
 * 改为客户端组件，使用 useAuth() 获取登录状态。
 * 保持和原来一样的 UI 结构和样式。
 *
 * 之前是服务端组件（用 getServerSession），
 * 现在改为客户端组件（用 useAuth hook），
 * 但用户看到的界面完全一样。
 */

"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  // 从认证上下文获取当前用户信息
  const { user } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 网站标题 / Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          我的博客
        </Link>

        {/* 导航链接 - 根据登录状态显示不同内容 */}
        <div className="flex items-center gap-4">
          {user ? (
            // 已登录：显示用户名 + 写文章按钮 + 登出按钮
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                管理
              </Link>
              <Link
                href={`/user/${user.id}`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {user.name}
              </Link>
              <Link
                href="/create"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                写文章
              </Link>
              {/* 登出按钮 */}
              <LogoutButton />
            </>
          ) : (
            // 未登录：显示登录和注册链接
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
