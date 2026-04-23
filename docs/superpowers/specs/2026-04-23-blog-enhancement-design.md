# 博客系统完善 - 设计文档

> 日期: 2026-04-23
> 方案: 轻量增强（方案 A）

## 概述

在现有博客系统基础上，新增 SEO 优化、阅读体验增强和浏览量统计三大模块，不引入新的第三方依赖。

---

## 一、SEO 三件套

### 1.1 Open Graph + Twitter Card

**改动文件**:
- `src/app/layout.tsx` — 全局 metadata 添加 openGraph 和 twitter 基础配置
- `src/app/post/[id]/page.tsx` — generateMetadata 中为每篇文章动态生成 OG/Twitter 标签

**全局配置 (layout.tsx)**:
```ts
export const metadata: Metadata = {
  title: { default: "我的博客 - 全栈学习项目", template: "%s - 我的博客" },
  description: "一个用 Next.js + Prisma + NextAuth 构建的全栈博客系统",
  openGraph: { siteName: "我的博客", type: "website", locale: "zh_CN" },
  twitter: { card: "summary_large_image" },
};
```

**文章级配置 (post/[id]/page.tsx generateMetadata)**:
- title: 文章标题
- description: 文章内容前 150 字符（去除 markdown 标记）
- openGraph: title + description + images(封面图) + type=article + publishedTime
- twitter: card + title + description + images

**内容截取逻辑**: 用正则去除 markdown 标记（`#`, `**`, `` ` ``, `[]()` 等），取前 150 字符作为 description。

### 1.2 XML Sitemap

**新增文件**: `src/app/sitemap.ts`

使用 Next.js 内置 sitemap 约定，导出 `MetadataRoute.Sitemap` 类型函数：
- 查询所有已发布文章的 id 和 updatedAt
- 生成条目: `/` (首页) + `/post/{id}` (每篇文章)
- 每条包含 url、lastModified、changeFrequency、priority

---

## 二、阅读体验增强

### 2.1 目录导航 (TOC)

**新增文件**: `src/components/TableOfContents.tsx`（客户端组件）

**工作原理**:
1. 接收 markdown 内容作为 props
2. 服务端从 markdown 正则提取 h2/h3 标题列表，传入客户端
3. 客户端渲染后给对应标题元素注入 id（`heading-{index}`）
4. 侧边栏展示层级列表（h2 一级，h3 二级缩进）
5. IntersectionObserver 监听，高亮当前阅读到的标题
6. 点击标题平滑滚动到对应位置

**改动**:
- `src/components/MarkdownRenderer.tsx` — h2/h3 渲染时支持传入 id
- `src/app/post/[id]/page.tsx` — 布局改为 flex，右侧固定 TOC
- `src/lib/extract-headings.ts` — 新增工具函数，从 markdown 提取标题

**响应式**:
- 桌面端: 文章右侧 sticky 侧边栏
- 移动端: 隐藏侧边栏

### 2.2 阅读进度条

**新增文件**: `src/components/ReadingProgress.tsx`（客户端组件）

**工作原理**:
- 固定在页面最顶部（z-50），高度 2px
- 使用 scroll 事件监听，计算文章 `<article>` 区域的滚动进度
- 进度 = (scrollTop - articleTop) / (articleHeight - viewportHeight)，clamp 到 0-100%
- 蓝色渐变背景（从蓝 400 到蓝 600），宽度随进度变化
- 使用 CSS transition 过渡动画

**改动**: `src/app/post/[id]/page.tsx` — 在页面顶部引入组件

### 2.3 代码复制按钮

**改动文件**: `src/components/MarkdownRenderer.tsx`

**工作原理**:
- 修改 `pre` 组件的渲染方式
- 每个 `<pre>` 内部右上角叠加一个复制按钮（半透明背景）
- 点击时提取内部 `<code>` 的 textContent，调用 navigator.clipboard.writeText()
- 复制成功：按钮显示"已复制"（1.5s 后恢复为复制图标）
- 悬停 pre 时才显示按钮（opacity 过渡）

**不引入新依赖**，纯 React state + clipboard API。

### 2.4 相关文章推荐

**改动文件**:
- `src/actions/post.ts` — 新增 `getRelatedPosts(postId, tagIds)` 函数
- `src/app/post/[id]/page.tsx` — 文章底部 + 评论区之间添加推荐区

**查询逻辑**:
- 从当前文章的标签 ID 列表出发
- Prisma 查询：找 tags 包含这些 ID 中任意一个的其他已发布文章
- 排除当前文章自身，限制 3 篇
- 按创建时间倒序排列

**UI**:
- 水平排列的卡片（grid-cols-3），每张显示封面图缩略图、标题、标签
- 如果没有相关文章则不显示整个区域

---

## 三、浏览量统计

### 3.1 数据模型变更

**改动文件**: `prisma/schema.prisma`

Post 模型新增字段:
```prisma
model Post {
  // ... 现有字段
  views Int @default(0)   // 浏览次数
}
```

运行 `npx prisma db push` 同步到数据库。

### 3.2 计数逻辑

**改动文件**: `src/actions/post.ts`

新增 `incrementView(id)` server action:
- 每次调用 `prisma.post.update({ where: { id }, data: { views: { increment: 1 } } })`
- 不做去重，简单计数

**调用方式**: 在 `post/[id]/page.tsx` 服务端组件渲染时调用。

### 3.3 浏览量展示

**改动文件**: `src/app/post/[id]/page.tsx`

在文章元信息区域（作者、日期旁边）添加:
```tsx
<span>·</span>
<span>{post.views} 次浏览</span>
```

---

## 文件变更汇总

| 操作 | 文件路径 |
|------|----------|
| 改动 | `prisma/schema.prisma` |
| 改动 | `src/app/layout.tsx` |
| 改动 | `src/app/post/[id]/page.tsx` |
| 改动 | `src/components/MarkdownRenderer.tsx` |
| 改动 | `src/actions/post.ts` |
| 新增 | `src/app/sitemap.ts` |
| 新增 | `src/components/TableOfContents.tsx` |
| 新增 | `src/components/ReadingProgress.tsx` |
| 新增 | `src/lib/extract-headings.ts` |

## 不做的事情

- 不引入新的第三方依赖
- 不做浏览量去重/防刷
- 不做 JSON-LD 结构化数据
- 不做 RSS 订阅
- 不做管理后台
