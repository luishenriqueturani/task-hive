import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import expressBasicAuth = require('express-basic-auth');
import { AppModule } from './app.module';
import { buildSwaggerDocument } from './openapi/swagger-document';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = Number(process.env.APP_PORT) || 3001;

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (swaggerUser && swaggerPassword) {
    app.use(
      ['/api', '/api-json'],
      expressBasicAuth({
        challenge: true,
        users: { [swaggerUser]: swaggerPassword },
      }),
    );
  } else {
    Logger.warn(
      'Swagger exposto sem HTTP Basic: defina SWAGGER_USER e SWAGGER_PASSWORD no .env (recomendado em qualquer ambiente acessível na rede).',
    );
  }

  const documentFactory = () => buildSwaggerDocument(app);
  SwaggerModule.setup('api', app, documentFactory);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
    }),
  );

  await app.listen(port);
}
bootstrap();
