/**
 * 文章相关的 Server Actions
 *
 * 这个文件是全栈开发的核心——CRUD（增删改查）。
 * 每个函数对应一个数据库操作：
 *
 * - createPost → INSERT（创建文章）
 * - getPosts   → SELECT（获取文章列表）
 * - getPost    → SELECT（获取单篇文章）
 * - updatePost → UPDATE（更新文章）
 * - deletePost → DELETE（删除文章）
 *
 * 全栈开发中 80% 的后端工作就是 CRUD，掌握这个你就掌握了核心。
 */

"use server";

import { prisma } from "@/lib/db";
import { postSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 创建新文章
 *
 * revalidatePath 是 Next.js 的缓存失效机制：
 * Next.js 会缓存页面的渲染结果，修改数据后需要告诉它"这个页面过期了"，
 * 下次访问时重新从数据库获取最新数据。
 */
export async function createPost(formData: FormData) {
  // 第一步：验证用户是否已登录
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  // 第二步：提取并验证表单数据
  const rawInput = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    coverImage: (formData.get("coverImage") as string) || undefined,
  };

  const validated = postSchema.safeParse(rawInput);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "输入数据无效";
    return { error: firstError };
  }

  const { title, content, coverImage, tagIds } = validated.data;

  // 判断是发布还是保存草稿（表单里可以传 action 字段）
  const action = formData.get("action") as string;
  const isPublished = action === "publish";

  // 从表单获取标签 ID 列表（逗号分隔的字符串）
  const rawTagIds = formData.get("tagIds") as string;
  const parsedTagIds = rawTagIds ? rawTagIds.split(",").filter(Boolean) : [];

  // 第三步：写入数据库
  await prisma.post.create({
    data: {
      title,
      content,
      coverImage: coverImage || null,
      authorId: session.user.id,
      published: isPublished,
      // 多对多关联：connect 把已有标签和文章关联起来
      tags: {
        connect: parsedTagIds.map((id) => ({ id })),
      },
    },
  });

  // 第四步：让相关页面的缓存失效
  revalidatePath("/");
  revalidatePath("/dashboard");

  // 第五步：跳转（草稿去管理页，发布去首页）
  redirect(isPublished ? "/" : "/dashboard");
}

/**
 * 获取文章列表（支持搜索）
 *
 * @param search 搜索关键词（模糊匹配标题和内容）
 */
export async function getPosts(search?: string) {
  // 构建查询条件
  const where: Record<string, unknown> = {
    published: true,
  };

  // 如果有搜索词，添加模糊匹配条件
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: {
      // 按创建时间倒序
      createdAt: "desc",
    },
    include: {
      // 同时获取作者的用户名（不需要密码等敏感字段）
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      // 同时获取文章的标签
      tags: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  return posts;
}

/**
 * 获取单篇文章详情
 *
 * findUnique 要求查询字段必须有唯一约束（@unique 或 @@unique）
 * 这里用 id 查询，因为 id 是主键，天然唯一
 */
export async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
      // 获取文章的标签
      tags: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  return post;
}

/**
 * 更新文章
 *
 * 安全检查：
 * 1. 必须登录
 * 2. 只能修改自己的文章（authorId 匹配）
 */
export async function updatePost(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  // 先检查文章是否存在且属于当前用户
  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return { error: "文章不存在" };
  }

  // 权限检查：只能编辑自己的文章
  if (existingPost.authorId !== session.user.id) {
    return { error: "只能编辑自己的文章" };
  }

  // 验证输入
  const rawInput = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
    coverImage: (formData.get("coverImage") as string) || undefined,
  };

  const validated = postSchema.safeParse(rawInput);
  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "输入数据无效";
    return { error: firstError };
  }

  const { title, content, coverImage } = validated.data;

  // 获取标签 ID
  const rawTagIds = formData.get("tagIds") as string;
  const parsedTagIds = rawTagIds ? rawTagIds.split(",").filter(Boolean) : [];

  // 更新数据库
  // 多对多更新策略：先断开所有旧标签（set: []），再连接新标签
  await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      coverImage: coverImage || null,
      tags: {
        // set: [] 先清空所有关联，再 connect 新的
        set: parsedTagIds.map((tid) => ({ id: tid })),
      },
    },
  });

  // 让相关页面的缓存失效
  revalidatePath("/");
  revalidatePath(`/post/${id}`);

  redirect(`/post/${id}`);
}

/**
 * 删除文章
 *
 * onDelete: Cascade 在 schema 里配置了，
 * 但这里我们显式删除，确保有权限检查
 */
export async function deletePost(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return { error: "文章不存在" };
  }

  if (existingPost.authorId !== session.user.id) {
    return { error: "只能删除自己的文章" };
  }

  await prisma.post.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");

  redirect("/dashboard");
}

/**
 * 获取当前用户的所有文章（包括草稿）
 */
export async function getMyPosts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });

  return posts;
}

/**
 * 切换文章的发布状态（发布 ↔ 草稿）
 */
export async function togglePublish(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "请先登录" };
  }

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return { error: "文章不存在" };
  }

  if (post.authorId !== session.user.id) {
    return { error: "只能操作自己的文章" };
  }

  // 切换状态：published 取反
  await prisma.post.update({
    where: { id },
    data: { published: !post.published },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath(`/post/${id}`);

  return { success: true };
}
