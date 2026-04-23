/**
 * 标签管理组件
 *
 * 在 Dashboard 页面中管理标签：创建和删除。
 * 客户端组件（需要交互和状态管理）
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { posts: number };
}

interface TagManagerProps {
  tags: Tag[];
}

export default function TagManager({ tags: initialTags }: TagManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 创建标签
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "创建失败");
        return;
      }

      // 添加到本地列表
      setTags((prev) => [...prev, data.data]);
      setNewTagName("");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  // 删除标签
  async function handleDelete(id: string) {
    if (!window.confirm("确定要删除这个标签吗？")) return;

    try {
      await fetch(`/api/tags/${id}`, { method: "DELETE" });
      setTags((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    } catch {
      // 静默失败
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">标签管理</h2>

      {/* 创建标签表单 */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="输入标签名称"
          maxLength={20}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !newTagName.trim()}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          添加
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* 标签列表 */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <span className="text-xs opacity-75">
              ({tag._count?.posts || 0})
            </span>
            <button
              type="button"
              onClick={() => handleDelete(tag.id)}
              className="ml-0.5 hover:opacity-70"
              title="删除标签"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-gray-400">还没有标签，创建一个吧</p>
        )}
      </div>
    </div>
  );
}
