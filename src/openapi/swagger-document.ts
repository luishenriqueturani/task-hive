import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';

/**
 * Garante `servers` e registo público mesmo quando o merge interno do Swagger
 * ou metadados antigos não refletem o esperado (ex.: Orval / clientes).
 */
function patchOpenApiDocument(
  doc: OpenAPIObject,
  serverUrl: string,
): OpenAPIObject {
  if (!doc.servers?.length) {
    doc.servers = [{ url: serverUrl, description: 'URL base da API' }];
  }
  const postUsers = doc.paths?.['/users']?.post;
  if (postUsers) {
    postUsers.security = [];
  }
  return doc;
}

/** Documento OpenAPI 3 usado pelo Swagger UI e pelo script `openapi:generate`. */
export function buildSwaggerDocument(app: INestApplication) {
  const port = Number(process.env.APP_PORT) || 3001;
  const openapiServerUrl =
    process.env.OPENAPI_SERVER_URL ?? `http://localhost:${port}`;

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

  const raw = SwaggerModule.createDocument(app, config);
  return patchOpenApiDocument(raw, openapiServerUrl);
}
