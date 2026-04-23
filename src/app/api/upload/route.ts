/**
 * 图片上传 API 路由
 *
 * 文件上传的完整流程：
 * 1. 前端选择图片文件
 * 2. 通过 FormData 发送到这个 API 路由
 * 3. 服务端把文件保存到 public/uploads/ 目录
 * 4. 返回可访问的图片 URL
 *
 * 为什么用 API 路由而不是 Server Action？
 * Server Actions 处理 FormData 中的文件有些限制，
 * 用 API 路由配合 Web API 的 Request 对象更灵活。
 *
 * 生产环境建议：
 * - 不要存本地文件系统（Vercel 等平台不支持持久化存储）
 * - 用对象存储（AWS S3、Cloudflare R2、Supabase Storage）
 * - 加上文件大小限制和类型检查
 */

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 允许的图片类型（防止上传恶意文件）
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// 最大文件大小：5MB
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "只支持 JPG、PNG、GIF、WebP 格式" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "图片大小不能超过 5MB" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成唯一文件名（时间戳 + 随机数，避免重名）
    const ext = file.name.split(".").pop() || "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // 确保 uploads 目录存在
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // 返回可访问的 URL
    const url = `/uploads/${uniqueName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("上传失败:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
