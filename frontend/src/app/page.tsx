/**
 * 首页 - 文章列表（搜索 + 分页）
 *
 * 改为客户端组件，使用 apiClient 从 NestJS 后端获取文章列表。
 * 之前是服务端组件直接查 Prisma 数据库。
 * URL 参数驱动：?search=关键词&page=2
 * UI 保持不变。
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";
import { Suspense } from "react";

// 每页显示的文章数
const PAGE_SIZE = 5;

/** 文章列表 API 返回的数据类型 */
interface PostListResponse {
  data: {
    id: string;
    title: string;
    content: string;
    coverImage: string | null;
    createdAt: string;
    author: { id: string; name: string; image: string | null };
    tags: { id: string; name: string; color: string }[];
  }[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/** 首页内容组件（需要 useSearchParams，所以包在 Suspense 里） */
function HomeContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1"));

  const [posts, setPosts] = useState<PostListResponse["data"]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // 当搜索条件或页码变化时重新获取数据
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        // 构建 query 参数
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(PAGE_SIZE),
        });
        if (search) {
          params.set("search", search);
        }

        const result = await apiClient.get<PostListResponse>(
          `/posts?${params.toString()}`
        );
        setPosts(result.data);
        setTotal(result.meta.total);
      } catch {
        // 静默失败，显示空列表
        setPosts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [search, currentPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 加载中状态
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 标题 + 搜索 */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {search ? `搜索: "${search}"` : "最新文章"}
          </h1>
          <p className="mt-2 text-gray-600">
            {search
              ? `找到 ${total} 篇文章`
              : `共 ${total} 篇文章`}
          </p>
        </div>
        <div className="w-64 shrink-0">
          <SearchBar />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            {search ? "没有找到匹配的文章" : "还没有文章"}
          </p>
          {!search && (
            <Link
              href="/create"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              写第一篇文章
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                content={post.content}
                coverImage={post.coverImage}
                createdAt={post.createdAt}
                author={post.author}
                tags={post.tags}
              />
            ))}
          </div>

          {/* 分页 */}
          <Pagination totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

/**
 * 首页入口
 * 用 Suspense 包裹是因为内部用了 useSearchParams()
 */
export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8"><p className="text-gray-500">加载中...</p></div>}>
      <HomeContent />
    </Suspense>
  );
}
