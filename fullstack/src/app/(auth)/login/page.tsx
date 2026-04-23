/**
 * 登录页面
 *
 * 这是你的第一个全栈页面！它连接了：
 * - 前端表单（React 组件）
 * - 后端验证（Zod schema）
 * - 认证服务（NextAuth）
 *
 * (auth) 是 Next.js 的路由组（Route Group）：
 * - 括号包起来的目录名不会出现在 URL 里
 * - 用于共享布局，/login 和 /register 共用同一个 auth 布局
 *
 * 登录流程：
 * 1. 用户填写邮箱密码
 * 2. 前端先做基础验证
 * 3. 调用 NextAuth 的 signIn（客户端版本）
 * 4. NextAuth 调用服务端的 authorize() 验证
 * 5. 验证通过 → 生成 session → 跳转首页
 */

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { loginSchema } from "@/lib/validations";

/**
 * 登录表单主组件
 * 抽出来是因为 useSearchParams 需要包裹 Suspense
 */
function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 检查是否是从注册页面跳转过来的
  const justRegistered = searchParams.get("registered") === "true";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawInput = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    // 前端验证
    const validated = loginSchema.safeParse(rawInput);
    if (!validated.success) {
      const errors = validated.error.flatten().fieldErrors;
      setError(Object.values(errors).flat()[0] || "输入数据无效");
      setLoading(false);
      return;
    }

    try {
      // 调用 NextAuth 客户端 signIn
      // 这会触发 auth.ts 中配置的 authorize() 函数
      const result = await signIn("credentials", {
        email: validated.data.email,
        password: validated.data.password,
        redirect: false, // 不自动跳转，我们自己处理
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        // 登录成功，跳转到首页
        router.push("/");
        // 刷新页面以更新服务端组件（如导航栏的登录状态）
        router.refresh();
      }
    } catch {
      setError("登录失败，请稍后重试");
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
