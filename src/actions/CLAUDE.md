# src/actions/ - Server Actions

Server Actions 用于处理表单提交和数据变更，标记 `"use server"`。

## 文件清单

### auth.ts - 认证相关

| 函数 | 用途 | 调用方 |
|------|------|--------|
| `registerUser(formData)` | 用户注册，密码 bcrypt 哈希后存库 | 注册页面表单 |
| `verifyCredentials(email, password)` | 验证邮箱密码（供 NextAuth 调用） | NextAuth CredentialsProvider |

**注意**: 登录不能用 Server Action，必须用客户端 `signIn("credentials")` from `next-auth/react`。

### post.ts - 文章 CRUD

| 函数 | 用途 | 调用方 |
|------|------|--------|
| `createPost(formData)` | 创建文章（action=publish 发布，action=draft 存草稿） | 创建页 / 编辑页 |
| `getPosts(search?)` | 获取已发布文章列表（支持搜索） | 首页 |
| `getPost(id)` | 获取单篇文章详情 | 文章详情页 |
| `updatePost(id, formData)` | 更新文章（含标签同步：`tags.set(tagIds.map(...))`) | 编辑页 |
| `deletePost(id)` | 删除文章（级联删除评论） | PostActions |
| `getMyPosts()` | 获取当前用户的所有文章（含草稿） | 仪表盘 |
| `togglePublish(id)` | 切换发布/草稿状态 | PostRowActions |

**标签处理**: createPost 从 formData 获取 `tagIds`（逗号分隔字符串），解析后关联。

### comment.ts - 评论 CRUD

| 函数 | 用途 | 调用方 |
|------|------|--------|
| `createComment(postId, content, parentId?)` | 发表评论（parentId 非空时为回复） | CommentForm / ReplyForm |
| `deleteComment(id)` | 删除评论（级联删除所有子回复） | DeleteCommentButton |
| `getComments(postId)` | 获取文章的所有评论（flat 列表） | CommentSection |

**嵌套回复**: 数据库存储 flat 列表（通过 parentId），前端用 `buildCommentTree()` 组装成树。

### tag.ts - 标签 CRUD

| 函数 | 用途 | 调用方 |
|------|------|--------|
| `getTags()` | 获取当前用户的标签（按 session 过滤） | TagSelector / TagManager |
| `createTag(name, color)` | 创建标签（自动绑定当前用户 authorId） | TagManager |
| `deleteTag(id)` | 删除标签（需验证所属用户） | TagManager |

**标签是用户私有的**: `getTags()` 通过 `getServerSession` 获取当前用户，只返回该用户的标签。

## 模式约定

1. **所有函数标记 `"use server"`** — 文件顶部声明
2. **权限检查**: 变更操作通过 `getServerSession` 获取当前用户，未登录抛错
3. **所有权验证**: deletePost/deleteComment/deleteTag 检查资源是否属于当前用户
4. **返回值**: 成功返回 `{ success: true, data }`，失败 throw Error
5. **中文注释**: 每个函数和关键逻辑块都有中文注释
