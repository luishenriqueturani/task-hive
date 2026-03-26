import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';

async function seedTask(app: INestApplication, token: string) {
  const pr = await request(app.getHttpServer())
    .post('/projects')
    .set(authHeader(token))
    .send({ name: 'Sub E2E', description: 'd' })
    .expect(201);
  const projectId = String(pr.body.id);
  const st = await request(app.getHttpServer())
    .post('/project-stages')
    .set(authHeader(token))
    .send({ name: 'C1', projectId, order: 0 })
    .expect(201);
  const task = await request(app.getHttpServer())
    .post('/tasks')
    .set(authHeader(token))
    .send({ name: 'Pai', stageId: String(st.body.id) })
    .expect(201);
  return String(task.body.id);
}

describe('Subtasks (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /subtasks — 422 sem taskId', async () => {
    const u = await registerUser(app, 'sb_val');
    await request(app.getHttpServer())
      .post('/subtasks')
      .set(authHeader(u.token))
      .send({ name: 'Sub' })
      .expect(422);
  });

  it('CRUD subtarefa — fluxo feliz', async () => {
    const u = await registerUser(app, 'sb_crud');
    const taskId = await seedTask(app, u.token);

    const sub = await request(app.getHttpServer())
      .post('/subtasks')
      .set(authHeader(u.token))
      .send({ name: 'Filha', taskId })
      .expect(201);
    const subId = String(sub.body.id);

    const byTask = await request(app.getHttpServer())
      .get(`/subtasks/task/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(byTask.body.some((s: { id: string }) => String(s.id) === subId)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/subtasks/${subId}`)
      .set(authHeader(u.token))
      .send({ name: 'Filha renomeada' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/subtasks/${subId}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('GET /subtasks e GET /subtasks/:id — listagem e detalhe', async () => {
    const u = await registerUser(app, 'sb_get');
    const taskId = await seedTask(app, u.token);
    const sub = await request(app.getHttpServer())
      .post('/subtasks')
      .set(authHeader(u.token))
      .send({ name: 'Para GET', taskId })
      .expect(201);
    const subId = String(sub.body.id);

    const all = await request(app.getHttpServer())
      .get('/subtasks')
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(all.body)).toBe(true);
    expect(all.body.some((s: { id: string }) => String(s.id) === subId)).toBe(
      true,
    );

    const one = await request(app.getHttpServer())
      .get(`/subtasks/${subId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(String(one.body.id)).toBe(subId);
    expect(one.body.name).toBe('Para GET');
  });
});
