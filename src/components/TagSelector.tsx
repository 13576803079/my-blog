/**
 * 标签选择器组件
 *
 * 用于创建/编辑文章时选择标签。
 *
 * 工作方式：
 * 1. 加载时获取所有可用标签
 * 2. 用户点击标签切换选中状态
 * 3. 选中的标签 ID 存入隐藏 input，随表单一起提交
 *
 * 多对多关系的前端表现：
 * 用户看到的是"选择多个标签"，提交到后端的是"一组标签 ID"，
 * Prisma 用这些 ID 在中间表 _PostToTag 中创建关联记录。
 */

"use client";

import { useState, useEffect } from "react";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  /** 当前已选中的标签 ID（编辑模式回填用） */
  selectedIds?: string[];
}

export default function TagSelector({ selectedIds = [] }: TagSelectorProps) {
  // 所有可用标签
  const [allTags, setAllTags] = useState<Tag[]>([]);
  // 当前选中的标签 ID 集合
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  // 加载状态
  const [loading, setLoading] = useState(true);

  // 加载所有标签
  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/tags");
        if (res.ok) {
          const data = await res.json();
          setAllTags(data.data || []);
        }
      } catch {
        // 静默失败，标签不是必选项
      } finally {
        setLoading(false);
      }
    }
    loadTags();
  }, []);

  // 切换标签选中状态
  function toggleTag(tagId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  if (loading) {
    return <p className="text-sm text-gray-400">加载标签中...</p>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        标签（可选，可多选）
      </label>

      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selected.has(tag.id)
                ? "text-white border-transparent"
                : "text-gray-600 border-gray-300 bg-white hover:border-gray-400"
            }`}
            // 选中时用标签自身的颜色
            style={
              selected.has(tag.id)
                ? { backgroundColor: tag.color, borderColor: tag.color }
                : {}
            }
          >
            {tag.name}
          </button>
        ))}

        {allTags.length === 0 && (
          <p className="text-sm text-gray-400">暂无标签，请先在标签管理中创建</p>
        )}
      </div>

      {/* 隐藏 input：把选中的标签 ID 传给 Server Action */}
      <input
        type="hidden"
        name="tagIds"
        value={Array.from(selected).join(",")}
      />
    </div>
  );
}
