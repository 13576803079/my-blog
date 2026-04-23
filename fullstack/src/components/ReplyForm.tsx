/**
 * 回复表单组件
 *
 * 点击"回复"按钮展开一个内联的迷你输入框。
 * 提交时带上 parentId，让后端知道这是对哪条评论的回复。
 */

"use client";

import { useState } from "react";
import { createComment } from "@/actions/comment";
import { useRouter } from "next/navigation";

interface ReplyFormProps {
  commentId: string;
  authorName: string;
  postId: string;
}

export default function ReplyForm({ commentId, authorName, postId }: ReplyFormProps) {
  const [showInput, setShowInput] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("content", content);
    // 关键：带上 parentId，告诉后端这是回复
    formData.append("parentId", commentId);

    try {
      const result = await createComment(postId, formData);
      if (result?.success) {
        setContent("");
        setShowInput(false);
        router.refresh();
      }
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
