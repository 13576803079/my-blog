/**
 * 用户服务 - 用户资料相关的数据库操作
 *
 * 功能：
 *   - 获取当前用户资料
 *   - 更新用户资料
 *   - 获取公开用户信息（含已发布文章）
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取当前用户的完整资料
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 返回用户信息，去掉密码
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 更新用户资料（只更新传入的字段）
   */
  async updateProfile(
    userId: string,
    data: { name?: string; image?: string; bio?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 获取用户的公开信息 + 已发布的文章列表
   * 用于用户主页展示
   */
  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        // 只返回该用户已发布的文章
        posts: {
          where: { published: true },
          include: {
            tags: true,
            _count: {
              select: { comments: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 去掉密码，只返回公开信息
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...publicInfo } = user;
    return publicInfo;
  }
}
