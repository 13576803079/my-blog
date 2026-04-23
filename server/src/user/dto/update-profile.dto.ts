/**
 * 更新用户资料 DTO - 更新个人资料时的请求体验证
 * 所有字段都是可选的，只更新传入的字段
 */
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  // 用户名：可选
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MaxLength(30, { message: '用户名最多 30 个字符' })
  name?: string;

  // 头像地址：可选
  @IsOptional()
  @IsString({ message: '头像地址必须是字符串' })
  image?: string;

  // 个人简介：可选
  @IsOptional()
  @IsString({ message: '简介必须是字符串' })
  @MaxLength(200, { message: '简介最多 200 个字符' })
  bio?: string;
}
