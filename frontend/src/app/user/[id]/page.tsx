/**
 * 用户公开主页
 *
 * 改为客户端组件，使用 apiClient GET /user/:id 获取用户信息和文章列表。
 * 之前是服务端组件，直接查 Prisma 数据库。
 * UI 保持不变。
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

/** 用户信息 + 文章列表 API 返回类型 */
interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  createdAt: string;
  posts: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    tags: { id: string; name: string; color: string }[];
  }[];
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        // 调用 NestJS 后端 API 获取用户信息和文章
        const data = await apiClient.get<UserProfile>(`/user/${userId}`);
        setUser(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  // 加载中
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  // 用户不存在
  if (notFound || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm mb-6 inline-block"
        >
          ← 返回首页
        </Link>
        <p className="text-gray-500 text-center py-16">用户不存在</p>
      </div>
    );
  }

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
        文章 ({user.posts.length})
      </h2>

      {user.posts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">还没有发布文章</p>
      ) : (
        <div className="space-y-4">
          {user.posts.map((post) => (
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
