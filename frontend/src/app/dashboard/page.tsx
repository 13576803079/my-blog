/**
 * 我的文章管理页面（Dashboard）
 *
 * 改为客户端组件，使用 apiClient 获取文章和标签数据。
 * 之前是服务端组件，直接用 Prisma 和 getServerSession。
 * UI 保持不变。
 */

"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostRowActions from "@/components/PostRowActions";
import TagManager from "@/components/TagManager";

/** 文章列表项类型 */
interface PostItem {
  id: string;
  title: string;
  createdAt: string;
  published: boolean;
}

/** 标签类型 */
interface Tag {
  id: string;
  name: string;
  color: string;
  _count?: { posts: number };
}

/** 文章列表 API 返回类型 */
interface PostListResponse {
  data: PostItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载文章和标签数据
  useEffect(() => {
    // 未登录时等待 auth 加载完成
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        // 并行加载文章列表和标签
        const [postsRes, tagsRes] = await Promise.all([
          apiClient.get<PostListResponse>("/posts?limit=100&all=true"),
          apiClient.get<Tag[]>("/tags"),
        ]);
        setPosts(postsRes.data);
        setTags(tagsRes);
      } catch {
        // 静默失败
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, router]);

  // 刷新数据的方法（子组件操作后调用）
  function refreshData() {
    setLoading(true);
    Promise.all([
      apiClient.get<PostListResponse>("/posts?limit=100"),
      apiClient.get<Tag[]>("/tags"),
    ])
      .then(([postsRes, tagsRes]) => {
        setPosts(postsRes.data);
        setTags(tagsRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  // 按状态分组：已发布 vs 草稿
  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);

  // 加载中
  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的文章</h1>
        <Link
          href="/create"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          写文章
        </Link>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{published.length}</p>
          <p className="text-sm text-gray-500">已发布</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{drafts.length}</p>
          <p className="text-sm text-gray-500">草稿</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{tags.length}</p>
          <p className="text-sm text-gray-500">标签</p>
        </div>
      </div>

      {/* 标签管理 */}
      <TagManager tags={tags} />

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">还没有写文章</p>
          <Link
            href="/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            开始写作
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* 发布状态标签 */}
                  {post.published ? (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                      已发布
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                      草稿
                    </span>
                  )}
                </div>
                <Link
                  href={`/post/${post.id}`}
                  className="text-gray-900 font-medium hover:text-blue-600 truncate block"
                >
                  {post.title}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>

              {/* 操作按钮 */}
              <PostRowActions
                postId={post.id}
                published={post.published}
                onAction={refreshData}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
