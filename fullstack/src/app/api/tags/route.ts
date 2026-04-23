/**
 * 标签 API 路由（用户私有）
 *
 * GET  /api/tags     → 获取当前用户的所有标签
 * POST /api/tags     → 为当前用户创建新标签
 *
 * 标签按用户隔离：每个用户有自己的标签集，不同用户可以有同名标签。
 */

import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** 获取当前用户的所有标签 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    // 未登录返回空列表（不报错，因为创建文章页面也需要加载标签）
    return success([]);
  }

  const tags = await prisma.tag.findMany({
    where: { authorId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });
  return success(tags);
}

/** 为当前用户创建新标签 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return error("请先登录", 401);
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return error("标签名不能为空");
  }
  if (name.length > 20) {
    return error("标签名最多20个字符");
  }

  // 同一用户下标签名唯一
  const existing = await prisma.tag.findFirst({
    where: { name: name.trim(), authorId: session.user.id },
  });
  if (existing) {
    return error("你已有同名标签");
  }

  const tag = await prisma.tag.create({
    data: { name: name.trim(), authorId: session.user.id },
  });

  return success(tag);
}
