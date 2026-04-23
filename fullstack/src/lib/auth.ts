/**
 * NextAuth.js 认证配置
 *
 * NextAuth 是 Next.js 最流行的认证库，支持多种登录方式。
 * 这里使用 Credentials Provider（邮箱+密码登录），最适合学习。
 *
 * 认证流程：
 * 1. 用户提交邮箱密码 → 前端调用 signIn()
 * 2. NextAuth 调用下面的 authorize() 函数
 * 3. authorize() 查数据库验证邮箱密码
 * 4. 验证通过 → 返回用户对象 → NextAuth 生成 session
 * 5. 验证失败 → 返回 null → 前端收到错误
 *
 * Session 策略使用 JWT（存在浏览器 cookie 里），
 * 不需要数据库存 session，简单且性能好。
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import { verifyPassword } from "./auth-utils";

export const authOptions: NextAuthOptions = {
  // 配置登录方式
  providers: [
    CredentialsProvider({
      name: "邮箱密码登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      /**
       * authorize 是认证的核心函数
       * 返回用户对象 = 登录成功
       * 返回 null = 登录失败
       * 抛出错误 = 登录出错
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }

        // 根据邮箱查找用户
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 用户不存在
        if (!user) {
          throw new Error("邮箱或密码错误");
        }

        // 验证密码
        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("邮箱或密码错误");
        }

        // 验证通过，返回用户信息（会存到 JWT token 里）
        // 注意：不要返回 password 字段！
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  // 自定义页面路径
  pages: {
    signIn: "/login", // 登录页面（默认是 NextAuth 自带的页面）
  },

  // 使用 JWT session（不存数据库，适合个人项目）
  session: {
    strategy: "jwt",
    // session 有效期 30 天
    maxAge: 30 * 24 * 60 * 60,
  },

  // JWT token 回调：控制 token 里存什么信息
  callbacks: {
    /**
     * jwt 回调：登录时和每次请求时都会调用
     * 把用户 ID 存到 token 里，后续可以通过 session 获取
     */
    async jwt({ token, user }) {
      // user 只在首次登录时有值
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * session 回调：每次前端调用 useSession() / getServerSession() 时触发
     * 把 token 里的信息传给前端 session 对象
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // 密钥，用于加密 JWT。生产环境必须用环境变量
  secret: process.env.NEXTAUTH_SECRET,
};
