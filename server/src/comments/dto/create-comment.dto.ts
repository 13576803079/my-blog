/**
 * 创建评论 DTO - 发表评论时的请求体验证
 */
import { IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  // 评论所属文章 ID：必填
  @IsString({ message: '文章 ID 必须是字符串' })
  postId: string;

  // 评论内容：必填
  @IsString({ message: '评论内容必须是字符串' })
  content: string;

  // 父评论 ID：可选（如果回复某条评论，就传该评论的 ID）
  @IsOptional()
  @IsString({ message: '父评论 ID 必须是字符串' })
  parentId?: string;
}
