/**
 * 文章列表 API - GET /api/posts
 *
 * RESTful 设计规范：
 * - GET /api/posts          → 获取文章列表（支持分页/过滤）
 * - GET /api/posts/:id      → 获取单篇文章
 * - POST /api/posts         → 创建文章
 * - PUT /api/posts/:id      → 更新文章
 * - DELETE /api/posts/:id   → 删除文章
 *
 * 查询参数：
 *   page=1          页码（默认第1页）
 *   limit=10        每页条数（默认10条，最多50条）
 *   search=关键词    搜索标题（模糊匹配）
 *   authorId=xxx    按作者筛选
 *
 * 示例：
 *   GET /api/posts?page=2&limit=5&search=夏日
 *   → 返回第2页，每页5条，标题包含"夏日"的文章
 */

import { prisma } from "@/lib/db";
import { success, paginatedSuccess, error } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    // 解析 URL 查询参数
    const { searchParams } = new URL(request.url);

    // 分页参数（带默认值和安全上限）
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    // 过滤参数
    const search = searchParams.get("search") || "";
    const authorId = searchParams.get("authorId") || "";

    // 构建查询条件（Prisma 的 where 是动态的）
    const where: Record<string, unknown> = {
      published: true, // 只查已发布的文章
    };

    // 如果有搜索关键词，加标题模糊匹配条件
    if (search) {
      where.title = {
        contains: search,
        // SQLite 不支持 mode 参数，PostgreSQL 才支持大小写不敏感
      };
    }

    // 如果指定了作者，加作者过滤条件
    if (authorId) {
      where.authorId = authorId;
    }

    // 并行执行两个查询：总数 + 当前页数据
    // 用 Promise.all 同时发两个查询，比串行快
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        // 排序：按创建时间倒序（最新的在前面）
        orderBy: { createdAt: "desc" },
        // 分页：skip 跳过多少条，take 取多少条
        skip: (page - 1) * limit,
        take: limit,
        // 关联查询：带上作者信息
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      // 统计符合条件的总记录数（用于计算总页数）
      prisma.post.count({ where }),
    ]);

    // 返回分页格式的响应
    return paginatedSuccess(posts, total, page, limit);
  } catch (err) {
    // 服务器错误，返回 500
    console.error("获取文章列表失败:", err);
    return error("获取文章列表失败", 500);
  }
}
