/**
 * 登出按钮组件
 *
 * 改为使用 useAuth() 的 logout() 方法。
 * 之前调用 NextAuth 的 signOut()，现在调用自定义的 logout()。
 * UI 保持不变。
 */

"use client";

import { useAuth } from "@/lib/auth-context";

export default function LogoutButton() {
  const { logout } = useAuth();

  async function handleLogout() {
    // 调用自定义的 logout，清除本地 token 和用户信息
    logout();
    // 跳转到首页
    window.location.href = "/";
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
