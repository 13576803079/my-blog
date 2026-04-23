/**
 * 我的文章管理页面（Dashboard）
 *
 * 这个页面展示当前用户的所有文章（包括草稿），
 * 可以对文章进行编辑、删除、发布/取消发布操作。
 *
 * 被 middleware 保护，未登录用户会被重定向到登录页。
 */

import { getMyPosts } from "@/actions/post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import PostRowActions from "@/components/PostRowActions";
import { getTags } from "@/actions/tag";
import TagManager from "@/components/TagManager";

export default async function DashboardPage() {
  // 获取当前用户
  const session = await getServerSession(authOptions);
  // 获取用户的所有文章
  const posts = await getMyPosts();
  const tags = await getTags();

  // 按状态分组：已发布 vs 草稿
  const published = posts.filter((p) => p.published);
  const drafts = posts.filter((p) => !p.published);

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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
