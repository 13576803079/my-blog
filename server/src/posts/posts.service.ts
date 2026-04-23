/**
 * 文章服务 - 文章相关的所有数据库操作
 *
 * 功能：
 *   - 文章列表查询（支持搜索、分页、按作者筛选）
 *   - 文章详情（自动增加浏览量）
 *   - 创建/更新/删除文章
 *   - 切换发布/草稿状态
 *   - 查询相关文章（通过共享标签）
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 查询文章列表（只返回已发布的文章）
   * 支持搜索、分页、按作者筛选
   */
  async findAll(params: {
    search?: string;
    page?: number;
    limit?: number;
    authorId?: string;
    includeDrafts?: boolean;
  }) {
    const { search, page = 1, limit = 5, authorId, includeDrafts = false } = params;

    // 构建 where 条件
    const where: any = {};

    // 按作者筛选时可以选择包含草稿（Dashboard 用）
    if (!includeDrafts) {
      where.published = true;
    }

    // 按作者筛选
    if (authorId) {
      where.authorId = authorId;
    }

    // 搜索关键词（匹配标题或内容）
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    // 计算分页偏移量
    const skip = (page - 1) * limit;

    // 并行查询文章列表和总数（性能优化）
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: {
          author: {
            // 只返回作者的公开信息
            select: { id: true, name: true, image: true },
          },
          tags: true,
          // 列表不返回评论，节省带宽
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: 'desc' }, // 按创建时间倒序
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * 查询单篇文章详情
   * 自动增加浏览量
   */
  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true, bio: true },
        },
        tags: true,
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    // 异步增加浏览量（不阻塞返回）
    this.incrementView(id);

    return post;
  }

  /**
   * 增加文章浏览量
   */
  async incrementView(id: string) {
    await this.prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  /**
   * 创建文章
   * @param authorId 作者 ID（从 JWT token 中获取）
   */
  async create(authorId: string, data: {
    title: string;
    content: string;
    coverImage?: string;
    published?: boolean;
    tagIds?: string[];
  }) {
    const { tagIds, ...postData } = data;

    // 创建文章，如果有 tagIds 就关联标签
    const post = await this.prisma.post.create({
      data: {
        ...postData,
        authorId,
        tags: tagIds
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        tags: true,
      },
    });

    return post;
  }

  /**
   * 更新文章（只能更新自己写的文章）
   */
  async update(id: string, userId: string, data: {
    title?: string;
    content?: string;
    coverImage?: string;
    published?: boolean;
    tagIds?: string[];
  }) {
    // 先检查文章是否存在，以及是否是作者本人
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('你只能编辑自己的文章');
    }

    const { tagIds, ...updateData } = data;

    // 更新文章
    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        ...updateData,
        // 如果传了 tagIds，先断开所有旧标签，再连接新标签
        tags: tagIds
          ? {
              set: tagIds.map((tagId) => ({ id: tagId })),
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        tags: true,
      },
    });

    return updated;
  }

  /**
   * 删除文章（只能删除自己写的文章）
   */
  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('你只能删除自己的文章');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: '文章已删除' };
  }

  /**
   * 切换文章的发布/草稿状态
   */
  async togglePublish(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('文章不存在');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('你只能操作自己的文章');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { published: !post.published }, // 切换状态
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        tags: true,
      },
    });

    return updated;
  }

  /**
   * 查询相关文章（通过共享标签）
   * 找到有相同标签的文章，按共享标签数量排序
   */
  async findRelated(id: string, limit: number = 5) {
    // 先获取当前文章的标签
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { tags: { select: { id: true } } },
    });

    if (!post) {
      throw new NotFoundException('文章不存在');
    }

    const tagIds = post.tags.map((t) => t.id);

    // 如果没有标签，返回同作者的其他文章
    if (tagIds.length === 0) {
      return this.prisma.post.findMany({
        where: {
          authorId: post.authorId,
          id: { not: id }, // 排除当前文章
          published: true,
        },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          tags: true,
          _count: {
            select: { comments: true },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    }

    // 查询有相同标签的已发布文章
    const related = await this.prisma.post.findMany({
      where: {
        id: { not: id }, // 排除自己
        published: true,
        tags: {
          some: {
            id: { in: tagIds },
          },
        },
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        tags: true,
        _count: {
          select: { comments: true },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return related;
  }
}
