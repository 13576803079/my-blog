/**
 * CurrentUser 自定义装饰器
 *
 * 用于从请求对象中提取当前登录用户信息。
 * 配合 JwtStrategy 使用，JWT 验证通过后会把用户信息挂到 req.user 上。
 *
 * 使用方式：
 *   @UseGuards(AuthGuard('jwt'))
 *   @Get('profile')
 *   getProfile(@CurrentUser() user) { ... }
 *
 * 其中 user 就是 req.user，包含 { id, email, name, ... }
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // 从ExecutionContext中获取请求对象
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 如果传了属性名，就只返回那个属性，比如 @CurrentUser('id')
    // 如果没传，就返回整个 user 对象
    return data ? user?.[data] : user;
  },
);
