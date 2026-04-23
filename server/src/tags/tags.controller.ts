/**
 * 标签控制器 - 处理标签相关的 HTTP 请求
 *
 * 路由前缀: /tags
 * 所有标签操作都需要登录，因为标签是用户私有的。
 *
 *   GET    /tags      - 获取当前用户的标签列表
 *   POST   /tags      - 创建标签
 *   DELETE /tags/:id  - 删除标签
 */
import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('tags')
@UseGuards(AuthGuard('jwt')) // 标签所有操作都需要登录
export class TagsController {
  constructor(private tagsService: TagsService) {}

  /**
   * 获取当前用户的标签列表
   */
  @Get()
  async findAll(@CurrentUser('id') userId: string) {
    return this.tagsService.findByUserId(userId);
  }

  /**
   * 创建新标签
   * 请求体: { name, color? }
   */
  @Post()
  async create(
    @Body() createTagDto: CreateTagDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tagsService.create(userId, createTagDto);
  }

  /**
   * 删除标签
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tagsService.remove(id, userId);
  }
}
