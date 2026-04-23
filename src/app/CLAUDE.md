# src/app/ - 页面路由与 API 路由

Next.js App Router：基于文件系统的路由。

## 页面路由

### `page.tsx` - 首页（服务端组件）

- 文章列表 + 搜索 + 分页
- URL 参数驱动: `?search=关键词&page=2`
- 每页 5 篇（`PAGE_SIZE = 5`），服务端分页
- 并行查询: `Promise.all([findMany, count])`
- 组件: `PostCard`、`SearchBar`、`Pagination`

### `(auth)/login/page.tsx` - 登录页（客户端组件）

- 使用 `signIn("credentials")` from `next-auth/react`（客户端调用）
- 包裹在 `<Suspense>` 中（因为使用 useSearchParams 做回调跳转）
- 错误提示通过 URL 参数 `?error=xxx` 传递

### `(auth)/register/page.tsx` - 注册页（客户端组件）

- 调用 Server Action `registerUser`
- 表单验证使用客户端 Zod schema
- 注册成功后自动跳转登录页

### `create/page.tsx` - 写文章（客户端组件）

- 表单: 标题、内容（Markdown）、封面图、标签选择
- 组件: `ImageUpload`（封面上传）、`TagSelector`（标签选择）
- 两个按钮: 发布（action=publish）、存草稿（action=draft）
- 提交调用 Server Action `createPost`

### `edit/[id]/page.tsx` - 编辑文章（客户端组件）

- 加载文章数据: `fetch(/api/posts/${id})` 获取现有内容
- `noValidate`: 禁用浏览器默认验证（因为封面图是相对路径）
- 提交调用 Server Action `updatePost`
- 隐藏 input 存储 coverImage 值

### `post/[id]/page.tsx` - 文章详情（服务端组件）

- `getPost(id)` 获取文章数据
- 组件: `MarkdownRenderer`（渲染 Markdown）、`CommentSection`（评论区）、`PostActions`（编辑/删除按钮）
- 文章不存在时显示 404

### `dashboard/page.tsx` - 仪表盘（服务端组件）

- 统计: 已发布文章数、草稿数
- 文章列表: `getMyPosts()` 获取当前用户所有文章
- 标签管理: 内嵌 `TagManager` 组件
- 每行文章: `PostRowActions`（编辑、切换发布/草稿、删除）

### `profile/page.tsx` - 编辑个人资料

- 修改用户名、头像、个人简介
- 头像上传: 复用 `ImageUpload` 组件
- 调用 API: `PUT /api/user`

### `user/[id]/page.tsx` - 公开用户主页

- 显示用户信息和该用户的已发布文章列表
- 组件: `PostCard` 列表

## API 路由

### `api/auth/[...nextauth]/route.ts` - 认证

NextAuth handler，所有认证相关的 API 都走这里。

### `api/posts/route.ts` - 文章列表 API

- `GET`: 支持分页（page, limit）、搜索（search）、按作者过滤（authorId）
- 返回格式: `{ success, data, meta: { total, page, limit } }`

### `api/posts/[id]/route.ts` - 单篇文章 API

- `GET`: 获取文章详情（含 author 和 tags）

### `api/tags/route.ts` - 标签 API

- `GET`: 获取当前用户的标签
- `POST`: 创建标签（需要登录，自动绑定 authorId）

### `api/tags/[id]/route.ts` - 标签删除

- `DELETE`: 删除标签（验证所属用户）

### `api/upload/route.ts` - 图片上传

- `POST`: 接收 FormData，验证文件类型和大小，保存到 `public/uploads/`
- 返回: `{ url: "/uploads/xxx.jpg" }`

### `api/user/route.ts` - 用户资料更新

- `PUT`: 更新用户名、头像、简介

### `api/user/profile/route.ts` - 获取当前用户资料

- `GET`: 返回当前登录用户的完整信息

## 路由保护

`middleware.ts` 使用 NextAuth `withAuth` 保护以下路由：
- `/create` - 写文章
- `/edit/*` - 编辑文章
- `/dashboard` - 仪表盘
- `/profile` - 个人资料

## 约定

1. **页面默认是服务端组件** — 只有需要交互时才加 `"use client"`
2. **API 响应格式统一** — 使用 `src/lib/api-response.ts` 的工具函数
3. **动态路由参数** — 通过 `{ params }` 获取，如 `post/[id]` 的 `params.id`
4. **(auth) 路由组** — 括号目录不影响 URL，用于共享布局（无导航栏）
