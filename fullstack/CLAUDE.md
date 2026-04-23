# My Blog - 全栈博客系统

> 学习项目：前端工程师转全栈的实战练习

## 技术栈

- **框架**: Next.js 16.2.3 (App Router + Turbopack)
- **数据库**: SQLite (开发) + Prisma v7.7.0 ORM
- **认证**: NextAuth v4 (Credentials + JWT)
- **验证**: Zod (前后端共享 schema)
- **样式**: Tailwind CSS
- **Markdown**: react-markdown + remark-gfm + rehype-highlight

## 开发命令

```bash
npm run dev          # 启动开发服务器
npx prisma studio    # 打开数据库可视化管理界面
npx prisma db push   # 同步 schema 到数据库（开发用）
npx prisma migrate dev --name xxx  # 创建迁移（生产用）
npx prisma generate  # 重新生成 Prisma Client
```

## 项目结构

```
my-blog/
├── prisma/
│   └── schema.prisma     # 数据模型定义（4 个模型）
├── dev.db                 # SQLite 数据库文件（在项目根目录，不是 prisma/ 下）
├── public/uploads/        # 用户上传的图片
├── src/
│   ├── actions/           # Server Actions（表单提交、数据变更）
│   │   ├── auth.ts        # 注册、验证凭据
│   │   ├── post.ts        # 文章 CRUD + 发布/草稿切换
│   │   ├── comment.ts     # 评论 CRUD（支持嵌套回复）
│   │   └── tag.ts         # 标签 CRUD（用户私有）
│   ├── app/               # 页面路由 + API 路由
│   │   ├── page.tsx       # 首页（文章列表 + 搜索 + 分页）
│   │   ├── (auth)/        # 认证路由组（login、register）
│   │   ├── create/        # 写文章
│   │   ├── edit/[id]/     # 编辑文章
│   │   ├── post/[id]/     # 文章详情
│   │   ├── dashboard/     # 用户仪表盘（管理文章和标签）
│   │   ├── profile/       # 编辑个人资料
│   │   ├── user/[id]/     # 公开用户主页
│   │   └── api/           # API 路由（RESTful）
│   ├── components/        # React 组件（16 个）
│   ├── lib/               # 工具函数和配置
│   │   ├── db.ts          # Prisma 客户端（单例模式）
│   │   ├── auth.ts        # NextAuth 配置
│   │   ├── auth-utils.ts  # 密码哈希 + 验证
│   │   ├── validations.ts # Zod 验证 schema
│   │   └── api-response.ts # API 响应格式化工具
│   ├── generated/prisma/  # Prisma 自动生成的客户端代码
│   ├── types/             # TypeScript 类型定义
│   └── middleware.ts      # 路由保护中间件
└── .env                   # 环境变量
```

## 关键约定

### 必须遵守

1. **所有代码注释用中文** — 这是学习项目，中文注释帮助理解
2. **禁止 Link 嵌套 Link** — 外层用 `div + router.push()`，内部链接用 `Link` + `e.stopPropagation()`
3. **标签是用户私有的** — 按 authorId 过滤，不同用户可以有同名标签
4. **Prisma v7 特殊用法** — 使用 `PrismaLibSql` 适配器，从 `@/generated/prisma/client` 导入
5. **数据库文件位置** — `dev.db` 在项目根目录，不在 `prisma/` 目录下

### Server Actions vs API Routes

- **Server Actions**: 表单提交、数据变更（create/update/delete），通过 `"use server"` 标记
- **API Routes**: 数据查询、文件上传、需要返回 JSON 的场景，位于 `src/app/api/`

### 客户端 vs 服务端组件

- 页面默认是服务端组件（async function，直接访问数据库）
- 需要交互（useState、useRouter、onClick）的组件加 `"use client"`
- `useSearchParams` 必须包裹在 `<Suspense>` 中

### 认证流程

- 注册: Server Action (`registerUser`) → 密码 bcrypt 哈希 → 存入数据库
- 登录: 客户端 `signIn("credentials", {...})` from `next-auth/react`
- 会话: JWT 策略，30 天有效期，session callback 注入 user.id
- 路由保护: `middleware.ts` 使用 `withAuth` 保护 /create, /edit, /dashboard, /profile

### 分页和搜索

- URL 参数驱动: `?search=关键词&page=2`
- 服务端完成分页（每页 5 篇，只取当前页数据）
- 搜索框 300ms 防抖

## 数据模型关系

```
User 1──N Post 1──N Comment──┐ (自引用：Comment.parentId → Comment.id)
                │            │
                └──N Tag N───┘ (多对多，通过 _PostToTag 中间表)
                     ↑
               authorId (用户私有标签)
```

## 环境变量

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="xxx"
NEXTAUTH_URL="http://localhost:3000"
```
