/**
 * 单个标签 API 路由
 *
 * DELETE /api/tags/:id → 删除标签
 * 删除标签时，Prisma 会自动清理中间表 _PostToTag 中的关联记录
 */

import { prisma } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return error("请先登录", 401);
  }

  const { id } = await params;

  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return error("标签不存在", 404);
  }

  // 删除标签（Prisma 自动清理中间表）
  await prisma.tag.delete({ where: { id } });

  return success({ deleted: true });
}
