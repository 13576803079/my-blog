/**
 * 评论区组件（支持嵌套回复）
 *
 * 数据结构：
 * 从数据库拿到的是 flat 列表（所有评论平铺），
 * 通过 parentId 组装成树形结构后渲染。
 *
 * 组装算法：
 * 1. 创建 id → comment 的映射表
 * 2. 遍历所有评论，把有 parentId 的评论塞到父评论的 replies 数组里
 * 3. 过滤出 parentId 为 null 的顶级评论
 */

import { getComments } from "@/actions/comment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CommentForm from "./CommentForm";
import DeleteCommentButton from "./DeleteCommentButton";

interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date | string;
  postId: string;
  authorId: string;
  parentId: string | null;
  author: { id: string; name: string; image: string | null };
  replies?: CommentWithAuthor[];
}

interface CommentSectionProps {
  postId: string;
}

/**
 * 把 flat 评论列表组装成树形结构
 */
function buildCommentTree(comments: CommentWithAuthor[]): CommentWithAuthor[] {
  const map = new Map<string, CommentWithAuthor>();

  // 先给每条评论初始化 replies 数组
  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  const roots: CommentWithAuthor[] = [];

  for (const comment of map.values()) {
    if (comment.parentId && map.has(comment.parentId)) {
      // 有父评论 → 作为回复加入父评论的 replies
      map.get(comment.parentId)!.replies!.push(comment);
    } else {
      // 无父评论 → 顶级评论
      roots.push(comment);
    }
  }

  return roots;
}

/**
 * 递归渲染单条评论及其回复
 */
function CommentItem({
  comment,
  postId,
  currentUserId,
  depth = 0,
}: {
  comment: CommentWithAuthor;
  postId: string;
  currentUserId: string | undefined;
  depth?: number;
}) {
  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""}>
      <div className="bg-gray-50 rounded-lg p-3 mb-2">
        {/* 评论者信息 + 时间 + 操作 */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {/* 回复标记 */}
            {depth > 0 && (
              <span className="text-xs text-gray-400">↳</span>
            )}
            <span className="text-sm font-medium text-gray-900">
              {comment.author.name}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 回复按钮 */}
            {currentUserId && (
              <ReplyButton commentId={comment.id} authorName={comment.author.name} postId={postId} />
            )}
            {/* 删除按钮 */}
            {currentUserId === comment.authorId && (
              <DeleteCommentButton commentId={comment.id} />
            )}
          </div>
        </div>

        {/* 评论内容 */}
        <p className="text-gray-700 text-sm whitespace-pre-line">
          {comment.content}
        </p>
      </div>

      {/* 递归渲染回复 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1 space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 回复按钮（客户端组件 - 内联 "use client" 不支持，抽成独立的小组件）
 * 为了简洁，直接在 CommentItem 里用 CommentForm 的迷你版
 */
import ReplyForm from "./ReplyForm";

function ReplyButton({ commentId, authorName, postId }: { commentId: string; authorName: string; postId: string }) {
  return (
    <ReplyForm commentId={commentId} authorName={authorName} postId={postId} />
  );
}

export default async function CommentSection({ postId }: CommentSectionProps) {
  const comments = await getComments(postId);
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  // 组装树形结构
  const commentTree = buildCommentTree(comments as CommentWithAuthor[]);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        评论 ({comments.length})
      </h2>

      {session?.user ? (
        <CommentForm postId={postId} />
      ) : (
        <p className="text-sm text-gray-500 mb-6">请先登录后发表评论</p>
      )}

      {commentTree.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">暂无评论，来抢沙发吧！</p>
      ) : (
        <div className="space-y-3">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
