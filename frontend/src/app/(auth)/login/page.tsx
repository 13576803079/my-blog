/**
 * 登录页面
 *
 * 改为使用自定义 useAuth() 的 login() 方法。
 * 之前调用 NextAuth 的 signIn()，现在调用 apiClient POST /auth/login。
 * UI 保持不变。
 *
 * 登录流程：
 * 1. 用户填写邮箱密码
 * 2. 前端做基础验证
 * 3. 调用 useAuth().login() → apiClient POST /auth/login
 * 4. 后端验证邮箱密码，返回 JWT token + 用户信息
 * 5. 前端保存 token 到 localStorage，更新 React 状态
 * 6. 跳转到首页
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

/**
 * 登录表单主组件
 * 抽出来是因为 useSearchParams 需要包裹 Suspense
 */
function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 检查是否是从注册页面跳转过来的
  const justRegistered = searchParams.get("registered") === "true";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 基础前端验证
    if (!email || !password) {
      setError("请输入邮箱和密码");
      setLoading(false);
      return;
    }

    try {
      // 调用自定义的 login 方法（内部调用 apiClient POST /auth/login）
      await login(email, password);
      // 登录成功，跳转到首页
      router.push("/");
    } catch (err) {
      // 显示后端返回的错误信息
      setError(err instanceof Error ? err.message : "邮箱或密码错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">登录</h1>

        {/* 注册成功提示 */}
        {justRegistered && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
            注册成功！请登录
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              邮箱
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 密码 */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="至少6位，包含字母和数字"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          还没有账号？{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * 登录页面入口
 * 用 Suspense 包裹是因为内部用了 useSearchParams()
 * Next.js 要求使用 searchParams 的组件必须在 Suspense 边界内
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
