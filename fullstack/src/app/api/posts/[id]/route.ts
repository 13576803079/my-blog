/**
 * 单篇文章 API 路由
 *
 * GET /api/posts/[id] → 获取文章详情
 *
 * 为什么需要这个 API 路由？
 * 编辑页面是客户端组件，useEffect 中无法直接调用 Server Action 获取数据。
 * 所以需要一个 API 端点供前端 fetch 调用。
 *
 * Server Actions 适合处理表单提交（写操作），
 * API 路由适合客户端组件主动获取数据（读操作）。
 * 实际项目中，你可以根据需要选择用哪种方式。
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { name: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json(post);
}
