/**
 * 首页 - 文章列表（搜索 + 分页）
 *
 * URL 参数驱动：
 * ?search=关键词&page=2
 *
 * 分页在服务端完成（每次只从数据库取当前页的数据），
 * 不需要一次性加载所有文章。
 */

import { getPosts } from "@/actions/post";
import { prisma } from "@/lib/db";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";
import PostCard from "@/components/PostCard";

// 每页显示的文章数
const PAGE_SIZE = 5;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1"));

  // 构建查询条件
  const where: Record<string, unknown> = { published: true };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  // 并行查询：当前页数据 + 总数
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: { select: { name: true, image: true, id: true } },
        tags: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
