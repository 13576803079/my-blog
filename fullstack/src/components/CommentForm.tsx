/**
 * 评论提交表单
 *
 * 客户端组件，因为需要：
 * - 状态管理（输入内容、loading）
 * - 提交后清空输入框
 *
 * 提交后用 router.refresh() 刷新服务端组件的数据
 */

"use client";

import { useState } from "react";
import { createComment } from "@/actions/comment";
import { useRouter } from "next/navigation";

interface CommentFormProps {
  postId: string;
}

export default function CommentForm({ postId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("content", content);

    try {
      const result = await createComment(postId, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        // 清空输入框
        setContent("");
        // 刷新服务端组件，让新评论显示出来
        router.refresh();
      }
    } catch {
      setError("评论失败，请稍后重试");
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
