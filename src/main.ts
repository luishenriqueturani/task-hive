import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import expressBasicAuth = require('express-basic-auth');
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = Number(process.env.APP_PORT) || 3001;
  const openapiServerUrl =
    process.env.OPENAPI_SERVER_URL ?? `http://localhost:${port}`;

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

  const config = new DocumentBuilder()
    .setTitle('Task Hive API')
    .setDescription(
      'API do Task Hive - projetos, tarefas, tarefas avulsas e empresas.\n\n' +
        '**Autenticação:** esta spec usa HTTP Bearer (JWT). Se o cliente for um BFF com sessão em cookie, ' +
        'o proxy deve enviar `Authorization: Bearer <token>` ao upstream (ou o backend passar a aceitar cookie) — documente o fluxo no deploy.',
    )
    .setVersion('1.0')
    .addServer(openapiServerUrl, 'URL base local ou proxy (use OPENAPI_SERVER_URL fora do default)')
    .addBearerAuth()
    .addTag('auth', 'Login, logout, recuperação de senha')
    .addTag('users', 'CRUD de usuários')
    .addTag('companies', 'CRUD de empresas')
    .addTag('projects', 'Projetos e colunas (stages)')
    .addTag('project-stages', 'Colunas do kanban')
    .addTag('tasks', 'Tarefas de projeto')
    .addTag('subtasks', 'Subtarefas')
    .addTag('to-do', 'Tarefas avulsas (recorrentes ou pontuais)')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
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
