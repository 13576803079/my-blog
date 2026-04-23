/**
 * Dashboard 文章行操作按钮
 *
 * 改为使用 apiClient 进行操作：
 * - PUT /posts/:id/toggle-publish：切换发布/草稿状态
 * - DELETE /posts/:id：删除文章
 * 之前用 Server Action deletePost 和 togglePublish。
 * UI 保持不变。
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

interface PostRowActionsProps {
  postId: string;
  published: boolean;
  /** 操作完成后的回调（刷新父组件数据） */
  onAction?: () => void;
}

export default function PostRowActions({
  postId,
  published,
  onAction,
}: PostRowActionsProps) {
  const [loading, setLoading] = useState(false);

  // 发布/取消发布
  async function handleToggle() {
    setLoading(true);
    try {
      // 调用 NestJS 后端 API 切换发布状态
      await apiClient.put(`/posts/${postId}/toggle-publish`);
      // 通知父组件刷新数据
      onAction?.();
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }

  // 删除
  async function handleDelete() {
    if (!window.confirm("确定要删除这篇文章吗？")) return;

    setLoading(true);
    try {
      // 调用 NestJS 后端 API 删除文章
      await apiClient.del(`/posts/${postId}`);
      // 通知父组件刷新数据
      onAction?.();
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 ml-4 shrink-0">
      <Link
        href={`/edit/${postId}`}
        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
      >
        编辑
      </Link>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="text-sm text-gray-600 hover:text-green-600 disabled:opacity-50 transition-colors"
      >
        {published ? "取消发布" : "发布"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
      >
        删除
      </button>
    </div>
  );
}
