# prisma/ - 数据库 Schema 与迁移

## 数据模型（4 个）

### User - 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| name | String | 用户名，用于显示 |
| email | String | 邮箱，用于登录，唯一 |
| password | String | bcrypt 哈希值（不是明文） |
| image | String? | 头像地址（可选） |
| bio | String? | 个人简介（可选） |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间（自动） |

### Post - 文章表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| title | String | 文章标题 |
| content | String | Markdown 内容 |
| coverImage | String? | 封面图地址（可选） |
| published | Boolean | false=草稿, true=已发布 |
| authorId | String (FK) | 所属用户 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### Comment - 评论表（自引用）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| content | String | 评论内容 |
| postId | String (FK) | 所属文章 |
| authorId | String (FK) | 评论者 |
| parentId | String? (FK) | 父评论 ID（null=顶级评论） |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**自引用关系**: `Comment.parentId → Comment.id`，通过 `@relation("CommentReplies")` 实现嵌套回复。
级联删除: 删除父评论时自动删除所有子回复（`onDelete: Cascade`）。

### Tag - 标签表（用户私有）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| name | String | 标签名 |
| color | String | 标签颜色（默认 #3B82F6） |
| authorId | String (FK) | 所属用户 |
| createdAt | DateTime | 创建时间 |

**约束**: `@@unique([authorId, name])` — 同一用户下标签名唯一，不同用户可有同名标签。

## 关系图

```
User ──1:N── Post ──1:N── Comment ──自引用── Comment
  │            │
  │            └──N:N── Tag
  │                     ↑
  └──1:N────────────────┘ (authorId: 标签属于用户)
```

- User → Post: 一对多（`onDelete: Cascade`）
- User → Comment: 一对多（`onDelete: Cascade`）
- Post → Comment: 一对多（`onDelete: Cascade`）
- Post ↔ Tag: 多对多（中间表 `_PostToTag`）
- Comment → Comment: 自引用一对多（`@relation("CommentReplies")`）
- User → Tag: 一对多（`onDelete: Cascade`）

## 迁移注意事项

### 开发环境

```bash
# 直接推送 schema 到数据库（不生成迁移文件）
npx prisma db push
```

### 添加新字段

1. 修改 `schema.prisma`
2. 运行 `npx prisma db push`
3. 重启开发服务器（Prisma Client 需要重新生成）

### 已踩过的坑

1. **Prisma v7 导入路径**: 从 `@/generated/prisma/client` 导入，不是 `@prisma/client`
2. **Prisma v7 必须用适配器**: `new PrismaLibSql({ url })` + `new PrismaClient({ adapter })`
3. **数据库文件位置**: `file:./dev.db` 创建在项目根目录
4. **给已有表加必填字段**: 需要先清空关联数据或提供默认值
5. **schema 变更后**: 必须重启 dev server，否则 `prisma.xxx` 可能 undefined

## Prisma Client 生成配置

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"  // 生成到 src/ 下，方便用 @/ 导入
}
```
