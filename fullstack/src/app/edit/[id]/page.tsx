/**
 * 编辑文章页面
 *
 * 这个页面展示了全栈开发中的"数据回填"模式：
 * 1. 从 URL 获取文章 ID
 * 2. 从数据库获取文章现有内容
 * 3. 把现有内容填充到表单中
 * 4. 用户修改后提交更新
 *
 * 权限检查在 updatePost Server Action 里完成，
 * 即使有人手动改 URL 访问别人的文章编辑页，也无法保存。
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { updatePost } from "@/actions/post";
import ImageUpload from "@/components/ImageUpload";
import Link from "next/link";

export default function EditPostPage() {
  // useParams() 获取 URL 中的动态参数（客户端组件用这个）
  const params = useParams();
  const postId = params.id as string;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // 表单状态（用于回填现有数据）
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");

  /**
   * 页面加载时获取文章现有内容
   *
   * 编辑页面需要先从数据库获取文章数据，回填到表单中。
   * 通过 API 路由 /api/posts/[id] 获取数据。
   */
  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (res.ok) {
          const post = await res.json();
          setTitle(post.title);
          setContent(post.content);
          // 回填封面图片 URL
          setCoverImage(post.coverImage || "");
        }
      } catch {
        setError("加载文章失败");
      } finally {
        setInitialLoading(false);
      }
    }
    loadPost();
  }, [postId]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await updatePost(postId, formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      setError("更新失败，请稍后重试");
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
        因为我们用 Zod 在服务端做验证，浏览器自带的验证会冲突。
        比如 type="url" 会拦截相对路径 /uploads/xxx.jpg。
      */}
      <form action={handleSubmit} noValidate className="space-y-6">
        {/* 封面图片：使用和创建页面一样的 ImageUpload 组件 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            封面图片（可选）
          </label>
          <ImageUpload
            value={coverImage}
            onChange={(url) => setCoverImage(url)}
          />
          {/* 隐藏 input，把图片 URL 传给 Server Action */}
          <input type="hidden" name="coverImage" value={coverImage} />
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

        {/* 内容 */}
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

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
