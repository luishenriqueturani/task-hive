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
      'API do Task Hive — projetos, tarefas, tarefas avulsas, planos, admin e suporte.\n\n' +
        '**Autenticação:** HTTP Bearer (JWT ou PAT `th_pat_…`). O BFF envia `Authorization: Bearer` a partir do cookie httpOnly.\n' +
        '**Quotas (402):** `PLAN_LIMIT_PROJECTS`, `PLAN_LIMIT_API_KEYS`, `PLAN_LIMIT_TODOS`, `PLAN_LIMIT_GUESTS`.',
    )
    .setVersion('1.0')
    .addServer(openapiServerUrl, 'URL base local ou proxy (use OPENAPI_SERVER_URL fora do default)')
    .addBearerAuth()
    .addTag('auth', 'Login, logout, recuperação de senha e tokens de API')
    .addTag('users', 'CRUD de usuários')
    .addTag('companies', 'CRUD de empresas')
    .addTag('projects', 'Projetos, participantes e convites')
    .addTag('project-stages', 'Colunas do kanban')
    .addTag('tasks', 'Tarefas de projeto')
    .addTag('subtasks', 'Subtarefas')
    .addTag('to-do', 'Tarefas avulsas (recorrentes ou pontuais)')
    .addTag('invites', 'Pré-visualizar e aceitar convite por token')
    .addTag('plans', 'Catálogo público de planos')
    .addTag('personal-access-tokens', 'Chaves de API do utilizador')
    .addTag('admin', 'Resumo do painel admin')
    .addTag('admin-users', 'Utilizadores (admin)')
    .addTag('admin-companies', 'Empresas (admin)')
    .addTag('admin-plans', 'Catálogo de planos (admin)')
    .addTag('admin-coupons', 'Cupons (admin)')
    .addTag('admin-subscriptions', 'Atribuir plano')
    .addTag('support', 'Tickets e mensagens de suporte')
    .build();

  const raw = SwaggerModule.createDocument(app, config);
  return patchOpenApiDocument(raw, openapiServerUrl);
}
