/**
 * Zod 验证规则
 *
 * Zod 的核心价值：一套 Schema 同时用于前端表单验证和后端数据校验。
 * 不需要前后端各写一套验证逻辑，减少不一致的风险。
 *
 * 用法示例：
 *   const result = registerSchema.safeParse(data)
 *   if (!result.success) { // 验证失败 }
 *   const validData = result.data
 */

import { z } from "zod";

// ========== 用户相关验证 ==========

/** 注册表单验证规则 */
export const registerSchema = z.object({
  // 用户名：3-20个字符，只允许字母数字下划线
  name: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),

  // 邮箱：必须是合法邮箱格式
  email: z.string().email("请输入有效的邮箱地址"),

  // 密码：至少6位，必须包含字母和数字
  password: z
    .string()
    .min(6, "密码至少6个字符")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "密码必须包含至少一个字母和一个数字"
    ),
});

/** 登录表单验证规则（比注册简单，只需邮箱和密码） */
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

// ========== 文章相关验证 ==========

/** 创建/编辑文章的验证规则 */
export const postSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题最多100个字符"),
  content: z.string().min(1, "内容不能为空"),
  // 封面图是可选的，可以是完整 URL 或相对路径（如 /uploads/xxx.jpg）
  coverImage: z.string().optional().or(z.literal("")),
  // 标签 ID 数组（可选，多对多关联）
  tagIds: z.array(z.string()).optional().default([]),
});
