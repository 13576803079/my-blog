/**
 * 更新文章 DTO - 更新文章时的请求体验证
 * 所有字段都是可选的，只更新传入的字段
 */
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdatePostDto {
  // 文章标题：可选
  @IsOptional()
  @IsString({ message: '标题必须是字符串' })
  title?: string;

  // 文章内容：可选
  @IsOptional()
  @IsString({ message: '内容必须是字符串' })
  content?: string;

  // 封面图片地址：可选
  @IsOptional()
  @IsString({ message: '封面图地址必须是字符串' })
  coverImage?: string;

  // 是否已发布：可选
  @IsOptional()
  @IsBoolean({ message: 'published 必须是布尔值' })
  published?: boolean;

  // 标签 ID 列表：可选（传入会完全替换旧的标签列表）
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '每个标签 ID 必须是字符串' })
  tagIds?: string[];
}
