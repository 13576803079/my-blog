/**
 * 认证服务 - 处理注册、登录、用户验证
 *
 * 核心逻辑：
 *   - 注册：密码用 bcrypt 加密后存入数据库
 *   - 登录：验证邮箱密码，成功后签发 JWT
 *   - 验证：通过 JWT payload 查找用户
 */
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private jwtService: JwtService,
  ) {}

  /**
   * 注册新用户
   * 1. 检查邮箱是否已被注册
   * 2. 用 bcrypt 对密码进行哈希（saltRounds=10）
   * 3. 创建用户记录
   * 4. 返回用户信息（不含密码）
   */
  async register(name: string, email: string, password: string) {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 密码哈希：saltRounds=10 是推荐的平衡值（安全 + 性能）
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 返回用户信息，去掉密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 验证用户凭据（邮箱 + 密码）
   * 用于登录时校验，成功返回用户信息（不含密码）
   */
  async validateUser(email: string, password: string) {
    // 根据邮箱查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // 用 bcrypt 比对密码哈希
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // 返回用户信息，去掉密码
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  /**
   * 登录：签发 JWT 令牌
   * payload 包含 sub（用户ID）和 email
   */
  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  /**
   * 根据 ID 查找用户（用于 JWT 验证）
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }
}
