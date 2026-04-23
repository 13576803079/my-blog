/**
 * 标签服务 - 标签的数据库操作
 *
 * 重要约定：标签是用户私有的！
 * - 每个用户有自己的一套标签
 * - 不同用户可以有同名标签
 * - 查询时必须按 authorId 过滤
 */
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取当前用户的所有标签
   * 标签是用户私有的，只能看自己的
   */
  async findByUserId(userId: string) {
    return this.prisma.tag.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        // 统计每个标签被多少篇文章使用
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  /**
   * 创建标签
   * 同一用户下标签名必须唯一（不同用户可以有同名标签）
   */
  async create(userId: string, data: { name: string; color?: string }) {
    // 检查同一用户下是否已有同名标签
    const existing = await this.prisma.tag.findFirst({
      where: {
        name: data.name,
        authorId: userId,
      },
    });
    if (existing) {
      throw new ConflictException('你已有一个同名标签');
    }

    return this.prisma.tag.create({
      data: {
        name: data.name,
        color: data.color || '#3B82F6',
        authorId: userId,
      },
    });
  }

  /**
   * 删除标签（只能删除自己的标签）
   */
  async remove(id: string, userId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }
    if (tag.authorId !== userId) {
      throw new ForbiddenException('你只能删除自己的标签');
    }

    // 删除标签（关联的文章-标签关系会自动解除）
    await this.prisma.tag.delete({ where: { id } });
    return { message: '标签已删除' };
  }
}
