import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import expressBasicAuth = require('express-basic-auth');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { buildSwaggerDocument } from './openapi/swagger-document';

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32) {
    Logger.error(
      'JWT_SECRET em falta ou demasiado curto (mínimo 32 caracteres). Defina em backend/.env',
    );
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const port = Number(process.env.APP_PORT) || 3001;
  const isProduction = process.env.NODE_ENV === 'production';

  const metricsToken = process.env.METRICS_TOKEN?.trim();
  app.use('/metrics', (req, res, next) => {
    if (!metricsToken) {
      if (isProduction) {
        res.status(404).end();
        return;
      }
      next();
      return;
    }
    const auth = req.headers.authorization;
    if (auth === `Bearer ${metricsToken}`) {
      next();
      return;
    }
    res.status(401).end();
  });

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (isProduction && (!swaggerUser || !swaggerPassword)) {
    Logger.warn(
      'Swagger desactivado em produção: defina SWAGGER_USER e SWAGGER_PASSWORD.',
    );
  } else {
    if (swaggerUser && swaggerPassword) {
      app.use(
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
    SwaggerModule.setup('swagger', app, documentFactory, {
      jsonDocumentUrl: 'api-json',
      yamlDocumentUrl: 'api-yaml',
    });
  }

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter),
  );

  await app.listen(port);
}
bootstrap();
