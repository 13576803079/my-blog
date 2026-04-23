/**
 * 根模块 - 组装所有功能模块
 *
 * ConfigModule: 读取 .env 环境变量
 * PrismaModule: 全局数据库访问（@Global）
 * AuthModule: 注册、登录、JWT 认证
 * PostsModule: 文章 CRUD
 * CommentsModule: 评论 CRUD（支持嵌套回复）
 * TagsModule: 标签管理（用户私有）
 * UploadModule: 图片上传
 * UserModule: 用户资料
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { TagsModule } from './tags/tags.module';
import { UploadModule } from './upload/upload.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // 配置模块：全局加载 .env 文件
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用，其他模块不需要再 import
    }),
    PrismaModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    TagsModule,
    UploadModule,
    UserModule,
  ],
})
export class AppModule {}
