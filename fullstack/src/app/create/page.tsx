/**
 * 创建文章页面
 *
 * 这个页面被 middleware 保护（见 middleware.ts），
 * 未登录用户访问会被自动重定向到 /login。
 *
 * 表单的 action 直接绑定 createPost Server Action，
 * 不需要额外的 API 路由。
 *
 * 图片上传流程：
 * 1. 用户点击上传区域 → 选择图片
 * 2. ImageUpload 组件自动上传到 /api/upload
 * 3. 返回图片 URL → 存入隐藏的 coverImage input
 * 4. 提交表单时 URL 一起发送给 Server Action
 */

"use client";

import { useState } from "react";
import { createPost } from "@/actions/post";
import ImageUpload from "@/components/ImageUpload";
import TagSelector from "@/components/TagSelector";
import Link from "next/link";

export default function CreatePostPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // 存储上传后的图片 URL
  const [coverImageUrl, setCoverImageUrl] = useState("");

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await createPost(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-blue-600 hover:underline text-sm mb-6 inline-block"
      >
        ← 返回首页
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">写新文章</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* 封面图片上传组件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            封面图片（可选）
          </label>
          <ImageUpload
            value={coverImageUrl}
            onChange={(url) => setCoverImageUrl(url)}
          />
          {/*
            隐藏的 input，存储上传后的图片 URL
            Server Action 通过 formData.get("coverImage") 获取这个值
          */}
          <input type="hidden" name="coverImage" value={coverImageUrl} />
        </div>

        {/* 文章标题 */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            标题
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            maxLength={100}
            placeholder="给文章起个标题..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 文章内容 */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            内容
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={12}
            placeholder="在这里写下你的文章内容..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* 标签选择 */}
        <TagSelector />

        {/* 操作按钮：发布 和 保存草稿 */}
        <div className="flex gap-3">
          <button
            type="submit"
            name="action"
            value="publish"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "提交中..." : "发布文章"}
          </button>
          <button
            type="submit"
            name="action"
            value="draft"
            disabled={loading}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "保存中..." : "保存草稿"}
          </button>
        </div>
      </form>
    </div>
  );
}
