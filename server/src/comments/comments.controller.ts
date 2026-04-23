/**
 * 评论控制器 - 处理评论相关的 HTTP 请求
 *
 * 路由前缀: /comments
 *   GET    /comments/post/:postId - 获取文章的所有评论（公开）
 *   POST   /comments              - 创建评论（需登录）
 *   DELETE /comments/:id          - 删除评论（需登录，仅评论者）
 */
import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  /**
   * 获取某篇文章的所有评论（包含嵌套回复）
   */
  @Get('post/:postId')
  async findByPostId(@Param('postId') postId: string) {
    return this.commentsService.findByPostId(postId);
  }

  /**
   * 创建评论（需要登录）
   * 请求体: { postId, content, parentId? }
   */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.create(userId, createCommentDto);
  }

  /**
   * 删除评论（需要登录，只能删除自己的评论）
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.remove(id, userId);
  }
}
