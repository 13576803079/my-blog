/**
 * 获取当前用户资料 API
 *
 * GET /api/user/profile → 返回当前登录用户的完整资料（含 bio）
 * NextAuth 的 session 默认不包含 bio 等自定义字段，
 * 所以需要单独的 API 获取。
 */

import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return error("请先登录", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    return error("用户不存在", 404);
  }

  return success(user);
}
