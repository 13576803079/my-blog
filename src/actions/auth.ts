/**
 * 用户认证相关的 Server Actions
 *
 * Server Actions 是 Next.js 的全栈特性：
 * - 函数在服务端执行，前端可以直接调用
 * - 不需要手写 API 路由
 * - 自带 CSRF 保护
 * - 支持表单原生提交（JS 禁用也能工作）
 *
 * "use server" 声明这个文件的所有函数都是服务端函数。
 * Next.js 会自动生成对应的客户端调用代码。
 *
 * 设计决策：
 * - 注册用 Server Action（需要操作数据库）
 * - 登录用客户端 signIn（NextAuth v4 的限制）
 *   因为 NextAuth v4 的 signIn 只在客户端可靠工作
 */

"use server";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";
import { registerSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

/**
 * 注册新用户
 *
 * 流程：
 * 1. 用 Zod 验证输入数据
 * 2. 检查邮箱是否已注册
 * 3. 加密密码
 * 4. 存入数据库
 * 5. 跳转到登录页（让用户手动登录）
 */
export async function registerUser(formData: FormData) {
  // 第一步：提取并验证表单数据
  const rawInput = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // safeParse 不会抛错，而是返回验证结果
  const validated = registerSchema.safeParse(rawInput);

  if (!validated.success) {
    const errors = validated.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0] || "输入数据无效";
    return { error: firstError };
  }

  const { name, email, password } = validated.data;

  // 第二步：检查邮箱是否已被注册
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "该邮箱已被注册" };
  }

  // 第三步：加密密码（绝对不能存明文！）
  const hashedPassword = await hashPassword(password);

  // 第四步：创建用户记录
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // 第五步：注册成功，跳转到登录页
  redirect("/login?registered=true");
}

/**
 * 检查邮箱密码是否匹配（给客户端登录用）
 *
 * 为什么不直接用 NextAuth 的 signIn？
 * 因为 NextAuth v4 的服务端 signIn API 不稳定，
 * 客户端 signIn 才是官方推荐的方式。
 * 这个函数只做预验证，实际的 session 创建由客户端 signIn 完成。
 */
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "邮箱或密码错误" };
  }

  // 动态导入 bcryptjs 的 compare 函数
  const bcrypt = await import("bcryptjs");
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return { error: "邮箱或密码错误" };
  }

  // 返回成功（不返回密码）
  return { success: true };
}
