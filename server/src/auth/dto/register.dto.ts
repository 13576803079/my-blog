/**
 * 注册 DTO - 用户注册时的请求体验证
 *
 * 使用 class-validator 装饰器进行参数校验，
 * 配合全局 ValidationPipe 自动生效。
 */
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  // 用户名：必填，字符串，2-30 个字符
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名至少 2 个字符' })
  @MaxLength(30, { message: '用户名最多 30 个字符' })
  name: string;

  // 邮箱：必填，合法邮箱格式
  @IsEmail({}, { message: '请输入正确的邮箱地址' })
  email: string;

  // 密码：必填，至少 6 个字符
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;
}
