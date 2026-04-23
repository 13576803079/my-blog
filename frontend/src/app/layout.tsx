/**
 * 根布局组件
 *
 * 这是整个应用的顶层布局，所有页面都会包裹在里面。
 * 根布局必须包含 <html> 和 <body> 标签。
 *
 * 关键点：
 * 1. 全局导航栏放在这里，所有页面都会显示
 * 2. AuthProvider 包裹 children，让客户端组件能用 useAuth()
 * 3. AuthProvider 是自定义的认证上下文提供者（不再用 NextAuth）
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 网页元数据（SEO 相关）
export const metadata: Metadata = {
  title: {
    default: "我的博客 - 全栈学习项目",
    template: "%s - 我的博客",
  },
  description: "一个用 Next.js + NestJS 构建的全栈博客系统",
  openGraph: {
    siteName: "我的博客",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        {/*
          AuthProvider 包裹整个应用
          让所有客户端组件都能通过 useAuth() 获取登录状态
        */}
        <AuthProvider>
          {/* 全局导航栏 - 显示登录状态和导航链接 */}
          <Navbar />
          {/* 页面内容 */}
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
