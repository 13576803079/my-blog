/**
 * 文章操作按钮组件
 *
 * 改为使用 useAuth() 获取用户信息，使用 apiClient 删除文章。
 * 之前用 useSession() 和 Server Action deletePost。
 * UI 保持不变。
 */

"use client";

import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PostActionsProps {
  postId: string;
  authorId: string;
}

export default function PostActions({ postId, authorId }: PostActionsProps) {
  // 从自定义认证上下文获取当前登录用户
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  // 如果未登录或者不是文章作者，不显示操作按钮
  if (!user?.id || user.id !== authorId) {
    return null;
  }

  /**
   * 处理删除操作
   *
   * 流程：
   * 1. 弹出确认对话框
   * 2. 用户确认后调用 apiClient DELETE /posts/:id
   * 3. 删除成功后跳转到首页
   */
  async function handleDelete() {
    // 浏览器原生确认对话框
    const confirmed = window.confirm("确定要删除这篇文章吗？删除后无法恢复。");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiClient.del(`/posts/${postId}`);
      // 删除成功跳转首页
      router.push("/");
    } catch {
      // 静默失败
    }
  }

  return (
    <div className="mt-6 flex items-center gap-4">
      {/* 编辑按钮 */}
      <Link
        href={`/edit/${postId}`}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        编辑
      </Link>

      {/* 删除按钮 */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
      >
        {deleting ? "删除中..." : "删除"}
      </button>
    </div>
  );
}
