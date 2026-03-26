import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';

async function createProject(
  app: INestApplication,
  token: string,
  name = 'Kanban E2E',
) {
  const res = await request(app.getHttpServer())
    .post('/projects')
    .set(authHeader(token))
    .send({ name, description: 'd' })
    .expect(201);
  return String(res.body.id);
}

describe('ProjectStages (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /project-stages — 422 sem campos obrigatórios', async () => {
    const u = await registerUser(app, 'st_val');
    await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(u.token))
      .send({ name: 'Col' })
      .expect(422);
  });

  it('GET /project-stages — 200 lista global', async () => {
    const u = await registerUser(app, 'st_all');
    const res = await request(app.getHttpServer())
      .get('/project-stages')
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('CRUD colunas — fluxo feliz', async () => {
    const u = await registerUser(app, 'st_crud');
    const projectId = await createProject(app, u.token);

    const col = await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(u.token))
      .send({
        name: 'To Do',
        projectId,
        order: 0,
      })
      .expect(201);
    expect(col.body.name).toBe('To Do');
    const stageId = String(col.body.id);

    const byProject = await request(app.getHttpServer())
      .get(`/project-stages/project/${projectId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(byProject.body)).toBe(true);

    const one = await request(app.getHttpServer())
      .get(`/project-stages/${stageId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(String(one.body.id)).toBe(stageId);

    const upd = await request(app.getHttpServer())
      .patch(`/project-stages/${stageId}`)
      .set(authHeader(u.token))
      .send({ name: 'Backlog' })
      .expect(200);
    expect(upd.body.name).toBe('Backlog');

    await request(app.getHttpServer())
      .delete(`/project-stages/${stageId}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('POST /project-stages — 403 participante sem permissão de gestão', async () => {
    const owner = await registerUser(app, 'st_own');
    const member = await registerUser(app, 'st_mem');
    const projectId = await createProject(app, owner.token);
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: member.id })
      .expect(201);

    await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(member.token))
      .send({ name: 'X', projectId, order: 0 })
      .expect(403);
  });
});
