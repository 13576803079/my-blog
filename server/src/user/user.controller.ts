/**
 * 用户控制器 - 处理用户资料相关的 HTTP 请求
 *
 * 路由前缀: /user
 *   GET /user/profile  - 获取当前用户资料（需登录）
 *   PUT /user/profile  - 更新当前用户资料（需登录）
 *   GET /user/:id      - 获取公开用户信息 + 已发布文章
 */
import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 获取当前登录用户的资料
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  /**
   * 更新当前用户的资料
   * 请求体: { name?, image?, bio? }
   */
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.userService.updateProfile(userId, updateProfileDto);
  }

  /**
   * 获取某用户的公开信息 + 已发布文章
   * 不需要登录即可查看
   */
  @Get(':id')
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }
}
