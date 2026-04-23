/**
 * 标签相关的 Server Actions（用户私有）
 *
 * 标签按用户隔离：
 * - getMyTags 只返回当前用户的标签
 * - createTag 自动绑定当前用户
 * - deleteTag 检查权限
 */

"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const tagNameSchema = z.object({
  name: z.string().min(1, "标签名不能为空").max(20, "标签名最多20个字符"),
});

/** 获取当前用户的标签 */
export async function getTags() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.tag.findMany({
    where: { authorId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

/** 创建标签（自动绑定当前用户） */
export async function createTag(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "请先登录" };

  const validated = tagNameSchema.safeParse({ name });
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors.name?.[0] || "标签名无效" };
  }

  const existing = await prisma.tag.findFirst({
    where: { name: validated.data.name, authorId: session.user.id },
  });
  if (existing) return { error: "你已有同名标签" };

  const tag = await prisma.tag.create({
    data: { name: validated.data.name, authorId: session.user.id },
  });

  revalidatePath("/dashboard");
  return { success: true, tag };
}

/** 删除标签（只能删自己的） */
export async function deleteTag(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "请先登录" };

  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) return { error: "标签不存在" };
  if (tag.authorId !== session.user.id) return { error: "只能删除自己的标签" };

  await prisma.tag.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { success: true };
}
