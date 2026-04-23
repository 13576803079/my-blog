# src/components/ - React 组件库

## 组件清单（16 个）

### 页面核心组件

| 组件 | 类型 | 用途 |
|------|------|------|
| `PostCard` | 客户端 | 文章卡片，点击跳转文章详情 |
| `MarkdownRenderer` | 客户端 | Markdown 渲染（react-markdown + remark-gfm + rehype-highlight） |
| `Pagination` | 客户端 | URL 驱动分页，页码 + 上/下一页 |
| `SearchBar` | 客户端 | 搜索框，300ms 防抖，URL 参数驱动 |

### 评论组件

| 组件 | 类型 | 用途 |
|------|------|------|
| `CommentSection` | 服务端 | 评论区容器，组装评论树 + 渲染 |
| `CommentForm` | 客户端 | 顶级评论表单（登录后显示） |
| `ReplyForm` | 客户端 | 内联回复表单（传入 parentId） |
| `DeleteCommentButton` | 客户端 | 删除评论按钮（仅作者可见） |

### 文章编辑组件

| 组件 | 类型 | 用途 |
|------|------|------|
| `ImageUpload` | 客户端 | 图片上传 + 预览（调用 /api/upload） |
| `TagSelector` | 客户端 | 标签多选器（加载用户标签 API） |
| `PostActions` | 客户端 | 文章详情页的编辑/删除按钮 |
| `PostRowActions` | 客户端 | 仪表盘文章行的操作按钮（编辑/发布/删除） |

### 标签管理

| 组件 | 类型 | 用途 |
|------|------|------|
| `TagManager` | 客户端 | 仪表盘中的标签 CRUD 管理界面 |

### 布局/认证组件

| 组件 | 类型 | 用途 |
|------|------|------|
| `Navbar` | 客户端 | 顶部导航栏（根据登录状态显示不同菜单） |
| `AuthProvider` | 客户端 | NextAuth SessionProvider 包装器 |
| `LogoutButton` | 客户端 | 登出按钮（调用 `signOut()`） |

## 关键设计模式

### 1. 禁止 Link 嵌套 Link

**问题**: 文章卡片外层需要整个可点击跳转，内部有作者链接。

**解决方案**: PostCard 使用 `div + router.push()` 替代外层 Link：

```tsx
// PostCard.tsx 的模式
<div onClick={() => router.push(`/post/${id}`)} className="cursor-pointer">
  {/* ... */}
  <Link href={`/user/${author.id}`} onClick={(e) => e.stopPropagation()}>
    {author.name}
  </Link>
</div>
```

### 2. useSearchParams 必须包裹 Suspense

SearchBar 和 Pagination 使用 `useSearchParams`，必须包裹 `<Suspense>`：

```tsx
export default function SearchBar() {
  return (
    <Suspense>
      <SearchBarInner />
    </Suspense>
  );
}
```

### 3. 评论树组装算法（CommentSection）

1. 从数据库拿到 flat 评论列表
2. 创建 `id → comment` 映射表
3. 遍历所有评论，有 parentId 的塞到父评论的 `replies` 数组
4. 过滤出 `parentId === null` 的顶级评论
5. 递归渲染 `CommentItem`

### 4. 防抖搜索（SearchBar）

```tsx
// 300ms 防抖
const debouncedSearch = useDebounce(searchTerm, 300);
useEffect(() => {
  const params = new URLSearchParams(searchParams);
  if (debouncedSearch) params.set("search", debouncedSearch);
  else params.delete("search");
  params.delete("page"); // 搜索时重置页码
  router.push(`?${params.toString()}`);
}, [debouncedSearch]);
```

### 5. URL 驱动状态（Pagination）

分页状态存在 URL 参数中，不使用 React state：
- 优点：刷新不丢失、可分享、浏览器前进后退支持
- 实现：`useSearchParams()` 读取，`router.push()` 更新

## 约定

1. **需要交互的组件才加 `"use client"`** — 其余保持服务端组件
2. **组件 props 用 interface 定义** — 文件内定义，不单独建 types 文件
3. **样式用 Tailwind CSS** — 不使用 CSS Modules 或 styled-components
4. **中文注释** — 每个组件顶部有中文 JSDoc 说明用途
5. **组件文件 < 130 行** — 保持小而聚焦，超长时拆分
