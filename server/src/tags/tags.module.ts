/**
 * 标签模块
 *
 * 提供标签管理功能。标签是用户私有的，不同用户可以有同名标签。
 */
import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
