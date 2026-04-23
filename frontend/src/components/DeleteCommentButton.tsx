/**
 * 删除评论按钮
 *
 * 改为使用 apiClient DELETE /comments/:id 删除评论。
 * 之前调用 Server Action deleteComment。
 * UI 保持不变。
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface DeleteCommentButtonProps {
  commentId: string;
  /** 删除成功后的回调（刷新评论列表） */
  onRefresh?: () => void;
}

export default function DeleteCommentButton({
  commentId,
  onRefresh,
}: DeleteCommentButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("确定要删除这条评论吗？")) return;

    setLoading(true);
    try {
      // 调用 NestJS 后端 API 删除评论
      await apiClient.del(`/comments/${commentId}`);
      // 通知父组件刷新评论列表
      onRefresh?.();
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
    >
      {loading ? "删除中" : "删除"}
    </button>
  );
}
