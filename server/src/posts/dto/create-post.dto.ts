/**
 * 创建文章 DTO - 创建文章时的请求体验证
 */
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreatePostDto {
  // 文章标题：必填
  @IsString({ message: '标题必须是字符串' })
  title: string;

  // 文章内容（Markdown 格式）：必填
  @IsString({ message: '内容必须是字符串' })
  content: string;

  // 封面图片地址：可选
  @IsOptional()
  @IsString({ message: '封面图地址必须是字符串' })
  coverImage?: string;

  // 是否已发布：可选，默认 false（草稿）
  @IsOptional()
  @IsBoolean({ message: 'published 必须是布尔值' })
  published?: boolean;

  // 标签 ID 列表：可选
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsString({ each: true, message: '每个标签 ID 必须是字符串' })
  tagIds?: string[];
}
