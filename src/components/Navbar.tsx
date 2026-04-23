/**
 * 导航栏组件
 *
 * 这个组件展示了全栈开发中一个重要的模式：
 * 同一个组件，根据登录状态显示不同的内容。
 *
 * getServerSession 是在服务端组件中获取 session 的方法。
 * 整个 Navbar 是服务端组件（没有 "use client"），
 * 所以不需要 useEffect 或 useState 来获取用户信息。
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  // 在服务端获取当前登录用户信息
  // 如果用户未登录，session 为 null
  const session = await getServerSession(authOptions);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 网站标题 / Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          我的博客
        </Link>

        {/* 导航链接 - 根据登录状态显示不同内容 */}
        <div className="flex items-center gap-4">
          {session?.user ? (
            // 已登录：显示用户名 + 写文章按钮 + 登出按钮
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                管理
              </Link>
              <Link
                href={`/user/${session.user.id}`}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {session.user.name}
              </Link>
              <Link
                href="/create"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                写文章
              </Link>
              {/* 登出按钮需要客户端交互，单独抽成客户端组件 */}
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
