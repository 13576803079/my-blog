/**
 * 用户资料 API
 *
 * PUT /api/user → 更新当前用户的资料（名字、简介、头像）
 *
 * RESTful 设计注意：
 * 更新"当前用户"的资料用 PUT /api/user（单数）
 * 而不是 PUT /api/users/:id（避免暴露用户 ID，也更安全）
 */

import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return error("请先登录", 401);
  }

  const body = await request.json();
  const { name, bio, image } = body;

  // 验证
  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return error("用户名不能为空");
  }

  // 构建更新数据（只更新传了值的字段）
  const data: Record<string, unknown> = {};
  if (name) data.name = name.trim();
  if (bio !== undefined) data.bio = bio;
  if (image !== undefined) data.image = image;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    // 不返回密码
    select: { id: true, name: true, email: true, image: true, bio: true },
  });

  return success(user);
}
