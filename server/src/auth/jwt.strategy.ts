/**
 * JWT 策略 - Passport 使用的 JWT 验证逻辑
 *
 * 工作流程：
 * 1. 从请求头 Authorization: Bearer <token> 中提取 JWT
 * 2. 用密钥验证签名是否有效
 * 3. 解码 payload，调用 validate() 方法
 * 4. validate() 返回的对象会被挂到 req.user 上
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaClient,
  ) {
    super({
      // 从 Authorization: Bearer xxx 中提取 token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 不忽略过期时间
      ignoreExpiration: false,
      // JWT 密钥从环境变量读取，提供默认值防止 undefined
      secretOrKey: configService.get<string>('JWT_SECRET') || 'my-blog-jwt-secret-change-in-production',
    });
  }

  /**
   * 验证 JWT payload
   * payload 是 JWT 解码后的内容，包含 { sub, email, iat, exp }
   * 返回值会挂到 req.user 上
   */
  async validate(payload: { sub: string; email: string }) {
    // 根据 payload 中的用户 ID 查找用户
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }

    // 返回用户信息（去掉密码），挂到 req.user
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }
}
