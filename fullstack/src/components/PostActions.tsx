/**
 * 文章操作按钮组件
 *
 * 包含编辑和删除功能，只有文章作者才能看到这些按钮。
 *
 * 为什么这是客户端组件？
 * - 删除操作需要 confirm() 弹窗确认
 * - 需要获取当前 session 来判断是否是作者
 * - 需要状态管理（loading 状态）
 *
 * 用 useSession() 而不是 getServerSession()，
 * 因为客户端组件没有服务端上下文。
 */

"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { deletePost } from "@/actions/post";
import Link from "next/link";

interface PostActionsProps {
  postId: string;
  authorId: string;
}

export default function PostActions({ postId, authorId }: PostActionsProps) {
  // 获取当前登录用户
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);

  // 如果未登录或者不是文章作者，不显示操作按钮
  if (!session?.user?.id || session.user.id !== authorId) {
    return null;
  }

  /**
   * 处理删除操作
   *
   * 流程：
   * 1. 弹出确认对话框
   * 2. 用户确认后调用 Server Action
   * 3. Server Action 删除数据库记录并重定向到首页
   */
  async function handleDelete() {
    // 浏览器原生确认对话框
    const confirmed = window.confirm("确定要删除这篇文章吗？删除后无法恢复。");
    if (!confirmed) return;

    setDeleting(true);
    await deletePost(postId);
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
