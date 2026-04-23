/**
 * 编辑文章页面
 *
 * 改为使用 apiClient 与 NestJS 后端交互：
 * - 加载文章数据：GET /posts/:id
 * - 提交更新：PUT /posts/:id
 * 之前用 fetch /api/posts 和 Server Action updatePost。
 * UI 保持不变。
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import ImageUpload from "@/components/ImageUpload";
import RichTextEditor from "@/components/RichTextEditor";
import TagSelector from "@/components/TagSelector";
import Link from "next/link";

/** 文章详情 API 返回的数据类型 */
interface PostDetail {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  tags: { id: string; name: string; color: string }[];
}

export default function EditPostPage() {
  // useParams() 获取 URL 中的动态参数（客户端组件用这个）
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 表单状态（用于回填现有数据）
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [existingTagIds, setExistingTagIds] = useState<string[]>([]);

  /**
   * 页面加载时获取文章现有内容
   *
   * 从 NestJS 后端 GET /posts/:id 获取文章数据，回填到表单中。
   */
  useEffect(() => {
    async function loadPost() {
      try {
        const post = await apiClient.get<PostDetail>(`/posts/${postId}`);
        setTitle(post.title);
        setContent(post.content);
        // 回填封面图片 URL
        setCoverImage(post.coverImage || "");
        // 回填已选标签
        setExistingTagIds(post.tags.map((t) => t.id));
      } catch {
        setError("加载文章失败");
      } finally {
        setInitialLoading(false);
      }
    }
    loadPost();
  }, [postId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // 收集选中的标签 ID
    const tagIdsValue = formData.get("tagIds") as string;
    const parsedTagIds = tagIdsValue
      ? tagIdsValue.split(",").filter(Boolean)
      : [];

    try {
      // 调用 NestJS 后端 API 更新文章
      await apiClient.put(`/posts/${postId}`, {
        title: formData.get("title"),
        content: content,
        coverImage: coverImage || undefined,
        tagIds: parsedTagIds,
      });

      // 更新成功，跳转到文章详情页
      router.push(`/post/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  // 加载中显示骨架屏
  if (initialLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/post/${postId}`}
        className="text-blue-600 hover:underline text-sm mb-6 inline-block"
      >
        ← 返回文章
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑文章</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {/*
        用 noValidate 禁用浏览器原生的 HTML5 表单验证。
        因为我们用后端做验证，浏览器自带的验证会冲突。
        比如 type="url" 会拦截相对路径 /uploads/xxx.jpg。
      */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 封面图片：使用和创建页面一样的 ImageUpload 组件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            封面图片（可选）
          </label>
          <ImageUpload
            value={coverImage}
            onChange={(url) => setCoverImage(url)}
          />
        </div>

        {/* 标题（受控组件，回填现有数据） */}
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 内容 - Markdown 富文本编辑器 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            内容
          </label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        {/* 标签选择（回填已有标签） */}
        <TagSelector selectedIds={existingTagIds} />

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "保存中..." : "保存修改"}
        </button>
      </form>
    </div>
  );
}
