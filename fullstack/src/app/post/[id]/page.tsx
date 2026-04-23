/**
 * 文章详情页
 *
 * [id] 是 Next.js 的动态路由参数。
 * 当用户访问 /post/abc123 时，params.id 就是 "abc123"。
 *
 * 这个页面也是服务端组件，直接查数据库渲染文章内容。
 * 底部的操作按钮（编辑/删除）是客户端组件 PostActions。
 */

import { getPost } from "@/actions/post";
import PostActions from "@/components/PostActions";
import CommentSection from "@/components/CommentSection";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import Link from "next/link";
import { notFound } from "next/navigation";

// 动态生成页面元数据（用于 SEO 和浏览器标签页标题）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return { title: "文章未找到" };
  }
  return { title: `${post.title} - 我的博客` };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 获取路由参数中的文章 ID
  const { id } = await params;

  // 查询数据库
  const post = await getPost(id);

  // 文章不存在，返回 404 页面
  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 返回首页链接 */}
      <Link
        href="/"
        className="text-blue-600 hover:underline text-sm mb-6 inline-block"
      >
        ← 返回首页
      </Link>

      <article className="bg-white rounded-lg border border-gray-200 p-8">
        {/* 封面图片 */}
        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        {/* 文章标题 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* 元信息 + 标签 */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>作者: {post.author.name}</span>
            <span>·</span>
            <time>
              {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1.5">
              {post.tags.map((tag: { id: string; name: string; color: string }) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-0.5 text-xs rounded-full text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 文章内容 - Markdown 渲染 */}
        <MarkdownRenderer content={post.content} />
      </article>

      {/* 文章操作按钮（编辑/删除）- 客户端组件 */}
      <PostActions postId={post.id} authorId={post.authorId} />

      {/* 评论区 - 包含评论列表和评论输入框 */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8">
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
}
