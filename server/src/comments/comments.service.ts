/**
 * 评论服务 - 评论的数据库操作
 *
 * 功能：
 *   - 查询某篇文章的所有评论（包含嵌套回复）
 *   - 创建评论（支持回复）
 *   - 删除评论（只能删自己的）
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取某篇文章的所有评论
   * 包含评论者信息和嵌套回复
   */
  async findByPostId(postId: string) {
    // 先检查文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 查询所有顶级评论（parentId 为 null）
    // 然后把回复嵌套在里面
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // 只查顶级评论
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        // 嵌套回复（二级）
        replies: {
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments;
  }

  /**
   * 创建评论
   * @param authorId 评论者 ID
   */
  async create(
    authorId: string,
    data: { postId: string; content: string; parentId?: string },
  ) {
    // 检查文章是否存在
    const post = await this.prisma.post.findUnique({
      where: { id: data.postId },
    });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 如果是回复，检查父评论是否存在
    if (data.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId,
        parentId: data.parentId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return comment;
  }

  /**
   * 删除评论（只能删除自己的评论）
   */
  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('你只能删除自己的评论');
    }

    // 删除评论（级联删除会自动删除子回复）
    await this.prisma.comment.delete({ where: { id } });
    return { message: '评论已删除' };
  }
}
