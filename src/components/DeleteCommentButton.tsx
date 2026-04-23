/**
 * 删除评论按钮
 *
 * 客户端组件，因为需要 confirm() 交互和状态管理
 */

"use client";

import { useState } from "react";
import { deleteComment } from "@/actions/comment";
import { useRouter } from "next/navigation";

export default function DeleteCommentButton({
  commentId,
}: {
  commentId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("确定要删除这条评论吗？")) return;

    setLoading(true);
    await deleteComment(commentId);
    router.refresh();
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
