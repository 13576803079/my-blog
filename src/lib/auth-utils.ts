/**
 * 密码加密工具
 *
 * bcrypt 是密码哈希的行业标准：
 * - 同一个密码每次哈希结果不同（因为有随机盐值）
 * - 无法从哈希值反推出原始密码
 * - 故意设计得很慢，防止暴力破解
 *
 * 为什么用 bcryptjs 而不是 bcrypt？
 * bcrypt 是 C++ 原生模块，在不同系统上编译经常出问题。
 * bcryptjs 是纯 JavaScript 实现，功能完全一样，安装零问题。
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * 对密码进行哈希加密
 * @param password 用户输入的明文密码
 * @returns 哈希后的密码字符串（可以直接存到数据库）
 *
 * saltRounds = 10 表示加密复杂度
 * 数字越大越安全，但计算越慢。10 是推荐的安全平衡点。
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * 验证密码是否正确
 * @param password 用户输入的密码
 * @param hashedPassword 数据库中存储的哈希密码
 * @returns true 表示密码正确
 *
 * 注意：不能用 === 比较，必须用 bcrypt.compare
 * 因为哈希值包含了盐值，compare 会自动提取盐值来验证
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 生成随机的 API 密钥或令牌
 * 用于 NextAuth 的 SECRET 环境变量等场景
 */
export function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
