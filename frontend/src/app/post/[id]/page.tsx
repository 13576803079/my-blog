/**
 * 文章详情页
 *
 * 保持为服务端组件以支持 SEO（generateMetadata）。
 * 直接用 fetch 从 NestJS 后端获取数据（不通过 apiClient，因为在服务端运行）。
 *
 * 交互部分（PostActions、CommentSection）是客户端组件，
 * 它们使用 useAuth() 和 apiClient。
 *
 * 功能：
 * - SEO 元数据（Open Graph + Twitter Card）
 * - 目录导航（TOC）
 * - 阅读进度条
 * - 代码块复制按钮
 * - 相关文章推荐
 * - 浏览量统计
 */

import PostActions from "@/components/PostActions";
import CommentSection from "@/components/CommentSection";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TableOfContents from "@/components/TableOfContents";
import ReadingProgress from "@/components/ReadingProgress";
import Link from "next/link";
import { notFound } from "next/navigation";
import { extractHeadings } from "@/lib/extract-headings";
import type { Metadata } from "next";

// 服务端渲染时优先使用 Docker 内部网络（不经 Nginx，更快）
const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** 文章详情数据类型 */
interface PostDetail {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  createdAt: string;
  views: number;
  authorId: string;
  published: boolean;
  author: { id: string; name: string; image: string | null };
  tags: { id: string; name: string; color: string }[];
}

/** 相关文章数据类型 */
interface RelatedPost {
  id: string;
  title: string;
  coverImage: string | null;
  tags: { id: string; name: string; color: string }[];
}

// 从 markdown 内容提取纯文本描述（用于 SEO）
function extractDescription(content: string, maxLength = 150): string {
  const plain = content
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/>\s+/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLength
    ? plain.slice(0, maxLength) + "..."
    : plain;
}

// 动态生成页面元数据（SEO + 社交分享）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    // 服务端直接 fetch（不通过 apiClient，不需要 token）
    const res = await fetch(`${API_URL}/posts/${id}`, { cache: "no-store" });
    if (!res.ok) return { title: "文章未找到" };

    const post: PostDetail = await res.json();
    const description = extractDescription(post.content);

    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: "article",
        publishedTime: post.createdAt,
        authors: [post.author.name],
        images: post.coverImage ? [{ url: post.coverImage }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
        images: post.coverImage ? [post.coverImage] : [],
      },
    };
  } catch {
    return { title: "文章未找到" };
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 服务端直接从 NestJS 后端获取文章数据
  let post: PostDetail;
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, { cache: "no-store" });
    if (!res.ok) notFound();
    post = await res.json();
  } catch {
    notFound();
  }

  // 提取标题用于目录导航
  const headings = extractHeadings(post.content);

  // 获取相关文章（服务端直接 fetch）
  let relatedPosts: RelatedPost[] = [];
  try {
    const res = await fetch(`${API_URL}/posts/${id}/related`, {
      cache: "no-store",
    });
    if (res.ok) {
      relatedPosts = await res.json();
    }
  } catch {
    // 相关文章获取失败不影响主页面
  }

  return (
    <>
      {/* 阅读进度条 */}
      <ReadingProgress />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 返回首页链接 */}
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm mb-6 inline-block"
        >
          ← 返回首页
        </Link>

        <div className="flex gap-8">
          {/* 文章主体 */}
          <div className="flex-1 min-w-0">
            <article
              data-article
              className="bg-white rounded-lg border border-gray-200 p-8"
            >
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
                  <span>·</span>
                  <span>{post.views} 次浏览</span>
                </div>
                {/* 标签 */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {post.tags.map(
                      (tag: { id: string; name: string; color: string }) => (
                        <span
                          key={tag.id}
                          className="px-2.5 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* 文章内容 - Markdown 渲染（带标题 id 和代码复制） */}
              <MarkdownRenderer content={post.content} headings={headings} />
            </article>

            {/* 文章操作按钮（编辑/删除）- 客户端组件 */}
            <PostActions postId={post.id} authorId={post.authorId} />

            {/* 相关文章推荐 */}
            {relatedPosts.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  相关文章
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/post/${related.id}`}
                      className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {related.coverImage && (
                        <img
                          src={related.coverImage}
                          alt={related.title}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {related.title}
                        </h3>
                        {related.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {related.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 text-xs rounded-full text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 评论区 */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8">
              <CommentSection postId={post.id} />
            </div>
          </div>

          {/* 右侧目录导航 */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-8">
                <TableOfContents headings={headings} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
