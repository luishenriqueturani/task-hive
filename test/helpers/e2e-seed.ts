import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { authHeader } from './e2e-auth';

export interface ProjectGraph {
  projectId: string;
  stageId: string;
  taskId: string;
  subtaskId: string;
}

/** Cria project → stage → task → subtask para testes de autorização A≠B. */
export async function seedProjectGraph(
  app: INestApplication,
  ownerToken: string,
): Promise<ProjectGraph> {
  const project = await request(app.getHttpServer())
    .post('/projects')
    .set(authHeader(ownerToken))
    .send({ name: 'Auth E2E graph', description: 'seed' })
    .expect(201);

  const projectId = String(project.body.id);

  const stage = await request(app.getHttpServer())
    .post('/project-stages')
    .set(authHeader(ownerToken))
    .send({ name: 'Coluna', projectId, order: 0 })
    .expect(201);

  const stageId = String(stage.body.id);

  const task = await request(app.getHttpServer())
    .post('/tasks')
    .set(authHeader(ownerToken))
    .send({ name: 'Tarefa auth', stageId })
    .expect(201);

  const taskId = String(task.body.id);

  const subtask = await request(app.getHttpServer())
    .post('/subtasks')
    .set(authHeader(ownerToken))
    .send({ name: 'Sub auth', taskId })
    .expect(201);

  return {
    projectId,
    stageId,
    taskId,
    subtaskId: String(subtask.body.id),
  };
}

/** Falha se qualquer chave `password` aparecer na resposta JSON. */
export function assertNoPasswordInBody(body: unknown): void {
  if (body === null || body === undefined) return;
  if (Array.isArray(body)) {
    body.forEach(assertNoPasswordInBody);
    return;
  }
  if (typeof body === 'object') {
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      expect(key).not.toBe('password');
      assertNoPasswordInBody(value);
    }
  }
}
