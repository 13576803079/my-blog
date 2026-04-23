/**
 * 登录 DTO - 用户登录时的请求体验证
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  // 邮箱：必填，合法格式
  @IsEmail({}, { message: '请输入正确的邮箱地址' })
  email: string;

  // 密码：必填
  @IsString({ message: '密码必须是字符串' })
  @MinLength(1, { message: '请输入密码' })
  password: string;
}
