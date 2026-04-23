/**
 * 认证控制器 - 处理注册、登录、获取当前用户
 *
 * 路由前缀: /auth
 *   POST /auth/register  - 注册新用户
 *   POST /auth/login     - 登录获取 JWT
 *   GET  /auth/me        - 获取当前登录用户信息（需认证）
 */
import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 注册新用户
   * 请求体: { name, email, password }
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );
    // 注册成功后自动登录，返回 JWT
    return this.authService.login(user);
  }

  /**
   * 用户登录
   * 请求体: { email, password }
   * 返回: { access_token, user }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // POST 登录返回 200 而不是 201
  async login(@Body() loginDto: LoginDto) {
    // 先验证邮箱密码
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证通过，签发 JWT
    return this.authService.login(user);
  }

  /**
   * 获取当前登录用户的资料
   * 需要带上 JWT token 才能访问
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
