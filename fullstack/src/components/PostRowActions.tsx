/**
 * Dashboard 文章行操作按钮
 *
 * 包含：编辑、发布/取消发布、删除
 * 客户端组件（需要交互）
 */

"use client";

import { useState } from "react";
import { deletePost, togglePublish } from "@/actions/post";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PostRowActionsProps {
  postId: string;
  published: boolean;
}

export default function PostRowActions({
  postId,
  published,
}: PostRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 发布/取消发布
  async function handleToggle() {
    setLoading(true);
    await togglePublish(postId);
    router.refresh();
  }

  // 删除
  async function handleDelete() {
    if (!window.confirm("确定要删除这篇文章吗？")) return;
    setLoading(true);
    await deletePost(postId);
    router.refresh();
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
