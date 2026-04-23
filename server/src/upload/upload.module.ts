/**
 * 文件上传模块
 *
 * 提供图片上传功能，保存到项目根目录的 public/uploads/ 文件夹。
 * 使用 Multer 中间件处理文件上传。
 */
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';

@Module({
  controllers: [UploadController],
})
export class UploadModule {}
