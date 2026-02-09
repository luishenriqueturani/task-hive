import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Task Hive API')
    .setDescription('API do Task Hive - projetos, tarefas, tarefas avulsas e empresas')
    .setVersion('1.0')
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

  app.useGlobalPipes(new ValidationPipe({
    errorHttpStatusCode: 422
  }));


  await app.listen(process.env.APP_PORT || 3001);
}
bootstrap();
