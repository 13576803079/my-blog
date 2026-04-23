/**
 * NestJS 应用启动入口
 *
 * 启动 HTTP 服务器，配置全局中间件和验证管道。
 * 端口 4000，避免和 Next.js 前端（3000）冲突。
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS，允许前端 http://localhost:3000 跨域访问
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // 全局验证管道：自动对 DTO 进行 class-validator 校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除 DTO 中没有定义的属性
      forbidNonWhitelisted: true, // 如果有未定义的属性则报错
      transform: true, // 自动把普通对象转换成 DTO 类实例
    }),
  );

  // 设置全局路由前缀（可选，方便前端统一加 /api 前缀）
  // app.setGlobalPrefix('api');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS 服务器已启动: http://localhost:${port}`);
}

bootstrap();
