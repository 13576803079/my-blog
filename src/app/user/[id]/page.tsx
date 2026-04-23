/**
 * 用户公开主页
 *
 * 访问 /user/xxx 可以查看该用户的资料和发布的文章。
 * 服务端组件，直接查数据库。
 */

import { prisma } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 查询用户资料
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  // 查询用户发布的文章
  const posts = await prisma.post.findMany({
    where: {
      authorId: id,
      published: true,
    },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { select: { id: true, name: true, color: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-blue-600 hover:underline text-sm mb-6 inline-block"
      >
        ← 返回首页
      </Link>

      {/* 用户信息卡片 */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="flex items-center gap-4">
          {/* 头像 */}
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.bio && (
              <p className="text-gray-600 mt-1">{user.bio}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              加入于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        文章 ({posts.length})
      </h2>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">还没有发布文章</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="text-gray-900 font-medium mb-1">{post.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2">
                {post.content.slice(0, 100)}...
              </p>
              <div className="mt-2 flex items-center justify-between">
                <time className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                </time>
                {post.tags.length > 0 && (
                  <div className="flex gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs rounded-full text-white"
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
      )}
    </div>
  );
}
