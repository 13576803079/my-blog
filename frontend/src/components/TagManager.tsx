/**
 * 标签管理组件
 *
 * 改为使用 apiClient 进行标签 CRUD 操作：
 * - GET /tags：获取当前用户的标签
 * - POST /tags：创建标签
 * - DELETE /tags/:id：删除标签
 * 之前用 fetch /api/tags。
 * UI 保持不变。
 *
 * 注意：现在组件自己负责加载标签数据（不再依赖父组件传入），
 * 但保留 tags prop 以便外部初始化时使用。
 */

"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { posts: number };
}

interface TagManagerProps {
  /** 外部传入的初始标签列表（可选） */
  tags?: Tag[];
}

export default function TagManager({ tags: initialTags }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 如果没有传入初始标签，自己加载
  useEffect(() => {
    if (!initialTags || initialTags.length === 0) {
      loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTags() {
    try {
      const data = await apiClient.get<Tag[]>("/tags");
      setTags(data);
    } catch {
      // 静默失败
    }
  }

  // 创建标签
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setError(null);
    setLoading(true);

    try {
      // 调用 NestJS 后端 API 创建标签
      const data = await apiClient.post<Tag>("/tags", {
        name: newTagName.trim(),
      });

      // 添加到本地列表
      setTags((prev) => [...prev, data]);
      setNewTagName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  // 删除标签
  async function handleDelete(id: string) {
    if (!window.confirm("确定要删除这个标签吗？")) return;

    try {
      // 调用 NestJS 后端 API 删除标签
      await apiClient.del(`/tags/${id}`);
      // 从本地列表移除
      setTags((prev) => prev.filter((t) => t.id !== id));
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
