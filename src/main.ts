import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    errorHttpStatusCode: 422
  }));

  await app.listen(process.env.APP_PORT || 3000);
}
bootstrap();
