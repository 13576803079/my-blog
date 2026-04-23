/**
 * 文章卡片组件
 *
 * 客户端组件，因为需要用 router.push 做跳转。
 * 避免 Link 嵌套：外层用 div + onClick，内部链接用 Link。
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  coverImage: string | null;
  createdAt: string | Date;
  author: { id: string; name: string };
  tags: { id: string; name: string; color: string }[];
}

export default function PostCard({
  id,
  title,
  content,
  coverImage,
  createdAt,
  author,
  tags,
}: PostCardProps) {
  const router = useRouter();

  return (
    <article className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* 外层用 div + onClick，避免嵌套 Link */}
      <div
        onClick={() => router.push(`/post/${id}`)}
        className="block p-6 cursor-pointer"
      >
        {coverImage && (
          <div className="mb-4 -mt-6 -mx-6">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 line-clamp-3">
          {content.slice(0, 150)}
          {content.length > 150 && "..."}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {/* 内部链接独立，不受外层 div 影响 */}
            <Link
              href={`/user/${author.id}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-blue-600 transition-colors"
            >
              {author.name}
            </Link>
            <span>·</span>
            <time>
              {new Date(createdAt).toLocaleDateString("zh-CN")}
            </time>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5">
              {tags.map((tag) => (
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
      </div>
    </article>
  );
}
