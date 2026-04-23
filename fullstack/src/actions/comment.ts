/**
 * 评论相关的 Server Actions
 *
 * 支持嵌套回复：
 * - 顶级评论：parentId 为 null
 * - 回复评论：parentId 指向被回复的评论
 *
 * 数据库自引用关系：Comment 的 parentId → Comment 的 id
 * 一条评论可以有多条回复（一对多自引用）
 */

"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const commentSchema = z.object({
  content: z.string().min(1, "评论内容不能为空").max(500, "评论最多500个字符"),
});

/**
 * 创建评论或回复
 *
 * @param postId 文章 ID
 * @param formData 表单数据（content + 可选的 parentId）
 */
export async function createComment(postId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return { error: "文章不存在" };
  }

  const content = formData.get("content") as string;
  // parentId 为空表示顶级评论，有值表示回复某条评论
  const parentId = (formData.get("parentId") as string) || null;

  const validated = commentSchema.safeParse({ content });
  if (!validated.success) {
    const firstError = Object.values(
      validated.error.flatten().fieldErrors
    ).flat()[0];
    return { error: firstError || "评论内容无效" };
  }

  // 如果是回复，验证父评论存在且属于同一篇文章
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parentComment || parentComment.postId !== postId) {
      return { error: "回复的评论不存在" };
    }
  }

  await prisma.comment.create({
    data: {
      content: validated.data.content,
      postId,
      authorId: session.user.id,
      parentId,
    },
  });

  revalidatePath(`/post/${postId}`);
  return { success: true };
}

/**
 * 删除评论（级联删除所有回复）
 */
export async function deleteComment(commentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return { error: "评论不存在" };
  }

  if (comment.authorId !== session.user.id) {
    return { error: "只能删除自己的评论" };
  }

  // onDelete: Cascade 会自动删除该评论下的所有回复
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/post/${comment.postId}`);
  return { success: true };
}

/**
 * 获取某篇文章的所有评论（树形结构）
 *
 * 查询所有评论，然后在前端/组件层组装成树形结构。
 * 用 flat 列表而非嵌套查询，因为 Prisma 不支持递归 include。
 */
export async function getComments(postId: string) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return comments;
}
