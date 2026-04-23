/**
 * 文章控制器 - 处理文章相关的 HTTP 请求
 *
 * 路由前缀: /posts
 *   GET    /posts                    - 文章列表（公开）
 *   GET    /posts/:id                - 文章详情（公开）
 *   POST   /posts                    - 创建文章（需登录）
 *   PUT    /posts/:id                - 更新文章（需登录，仅作者）
 *   DELETE /posts/:id                - 删除文章（需登录，仅作者）
 *   PUT    /posts/:id/toggle-publish - 切换发布状态（需登录，仅作者）
 *   GET    /posts/:id/related        - 相关文章（公开）
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  /**
   * 获取文章列表
   * 支持查询参数：search（搜索）、page（页码）、limit（每页数量）、authorId（按作者筛选）
   * all=true 时返回该作者的所有文章（含草稿），用于 Dashboard
   */
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('authorId') authorId?: string,
    @Query('all') all?: string,
  ) {
    return this.postsService.findAll({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 5,
      authorId,
      includeDrafts: all === 'true',
    });
  }

  /**
   * 获取单篇文章详情
   * 每次访问自动增加浏览量
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /**
   * 创建文章（需要登录）
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.create(userId, createPostDto);
  }

  /**
   * 更新文章（需要登录，只能更新自己的文章）
   */
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.update(id, userId, updatePostDto);
  }

  /**
   * 删除文章（需要登录，只能删除自己的文章）
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.remove(id, userId);
  }

  /**
   * 切换文章发布/草稿状态（需要登录，只能操作自己的文章）
   */
  @UseGuards(AuthGuard('jwt'))
  @Put(':id/toggle-publish')
  async togglePublish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.togglePublish(id, userId);
  }

  /**
   * 获取相关文章（基于共享标签）
   */
  @Get(':id/related')
  async findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findRelated(
      id,
      limit ? parseInt(limit, 10) : 5,
    );
  }
}
