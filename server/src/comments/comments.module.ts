/**
 * 评论模块
 *
 * 提供评论的 CRUD 功能，支持嵌套回复。
 */
import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
