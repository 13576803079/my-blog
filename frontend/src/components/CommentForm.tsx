/**
 * 评论提交表单
 *
 * 改为使用 apiClient POST /comments 提交评论。
 * 之前调用 Server Action createComment。
 * UI 保持不变。
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface CommentFormProps {
  postId: string;
  /** 提交成功后的回调（刷新评论列表） */
  onRefresh?: () => void;
}

export default function CommentForm({ postId, onRefresh }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setLoading(true);

    try {
      // 调用 NestJS 后端 API 创建评论
      await apiClient.post("/comments", {
        postId,
        content,
      });

      // 清空输入框
      setContent("");
      // 通知父组件刷新评论列表
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "评论失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      <div className="flex gap-3">
        {/* 评论输入框 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          maxLength={500}
          rows={2}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
        />

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
        >
          {loading ? "提交中" : "评论"}
        </button>
      </div>
    </form>
  );
}
