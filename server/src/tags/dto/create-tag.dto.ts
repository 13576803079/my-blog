/**
 * 创建标签 DTO - 创建标签时的请求体验证
 */
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTagDto {
  // 标签名称：必填
  @IsString({ message: '标签名必须是字符串' })
  @MaxLength(20, { message: '标签名最多 20 个字符' })
  name: string;

  // 标签颜色：可选，默认 #3B82F6（蓝色）
  @IsOptional()
  @IsString({ message: '颜色必须是字符串' })
  color?: string;
}
