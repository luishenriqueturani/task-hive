import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import expressBasicAuth = require('express-basic-auth');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { buildSwaggerDocument } from './openapi/swagger-document';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = Number(process.env.APP_PORT) || 3001;

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (swaggerUser && swaggerPassword) {
    app.use(
      // Path público alinhado com nginx `/swagger` (antes era `/api`, que
      // colidia com o BFF do Next e gerava assets relativos `./api/...`).
      ['/swagger', '/api-json', '/api-yaml'],
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
  // Path `swagger` = URL pública no Compose (`/swagger`). Mantém `/api-json`
  // para `openapi:pull` e clientes existentes.
  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'api-json',
    yamlDocumentUrl: 'api-yaml',
  });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter),
  );

  await app.listen(port);
}
bootstrap();
