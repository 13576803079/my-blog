/**
 * 回复表单组件
 *
 * 改为使用 apiClient POST /comments 提交回复（带 parentId）。
 * 之前调用 Server Action createComment。
 * UI 保持不变。
 */

"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface ReplyFormProps {
  commentId: string;
  authorName: string;
  postId: string;
  /** 提交成功后的回调（刷新评论列表） */
  onRefresh?: () => void;
}

export default function ReplyForm({ commentId, authorName, postId, onRefresh }: ReplyFormProps) {
  const [showInput, setShowInput] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      // 调用 NestJS 后端 API 创建回复评论
      await apiClient.post("/comments", {
        postId,
        content,
        parentId: commentId, // 关键：带上 parentId，告诉后端这是回复
      });

      setContent("");
      setShowInput(false);
      // 通知父组件刷新评论列表
      onRefresh?.();
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }

  if (!showInput) {
    return (
      <button
        type="button"
        onClick={() => setShowInput(true)}
        className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
      >
        回复
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`回复 ${authorName}...`}
          maxLength={500}
          autoFocus
          className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "..." : "回复"}
        </button>
        <button
          type="button"
          onClick={() => setShowInput(false)}
          className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          取消
        </button>
      </div>
    </form>
  );
}
