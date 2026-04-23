/**
 * 文章模块
 *
 * 提供文章的 CRUD 功能，包括列表查询、详情、创建、更新、删除、发布切换、相关文章。
 */
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
