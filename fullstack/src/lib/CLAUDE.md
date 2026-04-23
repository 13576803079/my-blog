# src/lib/ - 工具函数与配置

## 文件清单

### db.ts - Prisma 数据库客户端

**核心要点**:

1. **单例模式** — 用 `globalThis` 防止开发环境热重载时创建多个连接
2. **Prisma v7+ 适配器** — 不再自动连接数据库，需手动创建 `PrismaLibSql` 适配器
3. **导入路径** — 从 `@/generated/prisma/client` 导入（不是 `@prisma/client`）

```ts
// 正确的导入方式
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// 创建适配器（注意大小写：PrismaLibSql，不是 PrismaLibSQL）
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

**数据库文件位置**: `file:./dev.db` 创建在项目根目录，不在 `prisma/` 下。

### auth.ts - NextAuth 配置

- **策略**: Credentials Provider（邮箱 + 密码）
- **会话**: JWT 策略，30 天有效期
- **Callbacks**:
  - `jwt`: 把 user.id 写入 token
  - `session`: 把 token.id 写入 session.user.id
- **Pages**: 自定义登录页 `/login`

### auth-utils.ts - 密码工具

| 函数 | 用途 |
|------|------|
| `hashPassword(password)` | bcrypt 哈希，saltRounds=12 |
| `verifyPassword(password, hash)` | 验证密码是否匹配 |
| `generateSecret()` | 生成 NEXTAUTH_SECRET（开发用） |

### validations.ts - Zod 验证 Schema

前后端共享的验证规则：

| Schema | 字段 |
|--------|------|
| `registerSchema` | name(2-50字符), email(邮箱格式), password(6位以上) |
| `loginSchema` | email, password |
| `postSchema` | title(1-200), content(10字符以上), coverImage(可选), tagIds(可选数组) |

**注意**: `postSchema` 中 coverImage 是 `z.string().optional()`，不用 `.url()`（因为可能是相对路径 `/uploads/xxx.jpg`）。

### api-response.ts - API 响应工具

统一 API 返回格式：

```ts
// 成功响应
success(data, status?) → { success: true, data }

// 分页响应
paginatedSuccess(data, total, page, limit) → { success: true, data, meta: { total, page, limit, totalPages } }

// 错误响应
error(message, status?) → { success: false, error: message }
```

## 约定

1. **所有配置集中管理** — 数据库、认证、验证规则都在 `lib/` 下
2. **Prisma Client 不直接 new** — 通过 `db.ts` 的 `prisma` 单例使用
3. **Zod schema 复用** — 前端表单验证和后端 API 验证用同一套 schema
4. **环境变量** — `DATABASE_URL`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL` 在 `.env` 中
