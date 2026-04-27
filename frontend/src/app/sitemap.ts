/**
 * XML Sitemap 生成
 *
 * 改为从 NestJS 后端获取文章列表生成 sitemap。
 * 之前直接查 Prisma 数据库。
 * 保持 sitemap 格式和内容不变。
 */

import type { MetadataRoute } from "next";

// 前端基础 URL（用于生成 sitemap 中的 URL）
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
// 服务端渲染时优先使用 Docker 内部网络
const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 从 NestJS 后端获取所有已发布文章
  let posts: { id: string; updatedAt: string }[] = [];

  try {
    const res = await fetch(`${API_URL}/posts?limit=1000`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      posts = data.data || [];
    }
  } catch {
    // 获取失败时返回只有首页的 sitemap
  }

  // 文章页面
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/post/${post.id}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 首页
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...postEntries,
  ];
}
