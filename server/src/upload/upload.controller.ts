/**
 * 上传控制器 - 处理图片上传
 *
 * 路由前缀: /upload
 *   POST /upload - 上传图片，返回图片 URL
 *
 * 文件保存到 ../../public/uploads/（相对于 server/src/upload/），
 * 实际路径是项目根目录的 public/uploads/。
 * 这样 Next.js 前端可以直接通过 /uploads/filename 访问图片。
 */
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@Controller('upload')
@UseGuards(AuthGuard('jwt')) // 上传文件需要登录
export class UploadController {
  /**
   * 上传图片
   * 使用 Multer 的 diskStorage 存储到磁盘
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // 磁盘存储配置
      storage: diskStorage({
        // 保存到 frontend/public/uploads/（Next.js 从 frontend/public/ 提供静态文件）
        // 使用绝对路径，从项目根目录解析
        destination: (req, file, cb) => {
          // Docker 部署时通过 UPLOAD_DIR 指定路径，本地开发用默认路径
          const uploadPath = process.env.UPLOAD_DIR || join(process.cwd(), '..', 'frontend', 'public', 'uploads');
          // 确保目录存在
          const fs = require('fs');
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        // 文件名：时间戳 + 随机数 + 原始扩展名，避免重名
        filename: (_req, file, callback) => {
          // 生成唯一文件名
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      // 文件类型过滤：只允许图片
      fileFilter: (_req, file, callback) => {
        const allowedTypes = /jpg|jpeg|png|gif|webp/;
        // 检查文件扩展名
        const ext = extname(file.originalname).toLowerCase().replace('.', '');
        // 检查 MIME 类型
        const isAllowedMime = file.mimetype.startsWith('image/');
        const isAllowedExt = allowedTypes.test(ext);

        if (isAllowedMime && isAllowedExt) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(
              '只支持 jpg、jpeg、png、gif、webp 格式的图片',
            ),
            false,
          );
        }
      },
      // 文件大小限制：5MB
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    // 返回图片的访问 URL（前端可以通过 Next.js 的 public 目录访问）
    return {
      url: `/uploads/${file.filename}`,
    };
  }
}
