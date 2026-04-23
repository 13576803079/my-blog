/**
 * 认证模块 - 注册、登录、JWT 策略
 *
 * 导入：
 *   - JwtModule: 提供 JWT 签发服务
 *   - PassportModule: 提供 AuthGuard('jwt') 守卫
 *   - ConfigModule: 读取环境变量（全局已加载）
 *
 * 提供：
 *   - AuthService: 认证业务逻辑
 *   - JwtStrategy: JWT 验证策略
 *
 * 导出：
 *   - AuthService: 其他模块可能需要使用（比如关联用户）
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Passport 注册为全局可用
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JWT 模块：使用 ConfigService 动态读取密钥
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' }, // JWT 有效期 30 天
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // 导出给其他模块使用
})
export class AuthModule {}
