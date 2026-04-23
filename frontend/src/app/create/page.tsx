/**
 * 创建文章页面
 *
 * 改为使用 apiClient POST /posts 创建文章。
 * 之前调用 Server Action createPost，现在调用 NestJS 后端 API。
 * UI 保持不变。
 *
 * 图片上传流程（不变）：
 * 1. 用户选择图片 → ImageUpload 上传到后端
 * 2. 后端返回图片 URL
 * 3. 提交表单时 URL 随文章数据一起发送
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import ImageUpload from "@/components/ImageUpload";
import TagSelector from "@/components/TagSelector";
import RichTextEditor from "@/components/RichTextEditor";
import Link from "next/link";

export default function CreatePostPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = (formData.get("action") as string) || "publish";

    // 收集选中的标签 ID（从 TagSelector 的隐藏 input 中读取）
    const tagIdsValue = formData.get("tagIds") as string;
    const parsedTagIds = tagIdsValue
      ? tagIdsValue.split(",").filter(Boolean)
      : [];

    try {
      // 调用 NestJS 后端 API 创建文章
      await apiClient.post("/posts", {
        title: formData.get("title"),
        content: content,
        coverImage: coverImageUrl || undefined,
        published: action === "publish",
        tagIds: parsedTagIds,
      });

      // 创建成功，跳转到首页
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败，请稍后重试");
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 封面图片上传组件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            封面图片（可选）
          </label>
          <ImageUpload
            value={coverImageUrl}
            onChange={(url) => setCoverImageUrl(url)}
          />
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

        {/* 文章内容 - Markdown 富文本编辑器 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            内容
          </label>
          <RichTextEditor value={content} onChange={setContent} />
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
