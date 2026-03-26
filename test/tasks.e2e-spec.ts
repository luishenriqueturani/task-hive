import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';

async function seedProjectWithStage(app: INestApplication, token: string) {
  const pr = await request(app.getHttpServer())
    .post('/projects')
    .set(authHeader(token))
    .send({ name: 'T E2E', description: 'd' })
    .expect(201);
  const projectId = String(pr.body.id);
  const st = await request(app.getHttpServer())
    .post('/project-stages')
    .set(authHeader(token))
    .send({ name: 'Col1', projectId, order: 0 })
    .expect(201);
  return { projectId, stageId: String(st.body.id) };
}

describe('Tasks (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /tasks — 422 sem stageId', async () => {
    const u = await registerUser(app, 'tk_val');
    await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(u.token))
      .send({ name: 'Tarefa' })
      .expect(422);
  });

  it('CRUD tarefa e timetrack HTTP — fluxo feliz', async () => {
    const u = await registerUser(app, 'tk_flow');
    const { stageId } = await seedProjectWithStage(app, u.token);

    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(u.token))
      .send({ name: 'Implementar E2E', stageId })
      .expect(201);
    const taskId = String(taskRes.body.id);
    expect(taskRes.body.name).toBe('Implementar E2E');

    const mine = await request(app.getHttpServer())
      .get('/tasks')
      .set(authHeader(u.token))
      .expect(200);
    expect(mine.body.some((t: { id: string }) => String(t.id) === taskId)).toBe(true);

    const byStage = await request(app.getHttpServer())
      .get(`/tasks/stage/${stageId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(byStage.body)).toBe(true);

    const one = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(String(one.body.id)).toBe(taskId);

    const track = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/timetrack/start`)
      .set(authHeader(u.token))
      .send({})
      .expect(201);
    const trackId = String(track.body.id);

    const listed = await request(app.getHttpServer())
      .get(`/tasks/${taskId}/timetrack`)
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(listed.body)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/timetrack/${trackId}/stop`)
      .set(authHeader(u.token))
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .send({ name: 'E2E ok' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('GET /tasks/:id/timetrack — 404 tarefa inexistente', async () => {
    const u = await registerUser(app, 'tk_404');
    await request(app.getHttpServer())
      .get('/tasks/1/timetrack')
      .set(authHeader(u.token))
      .expect(404);
  });

  it('PATCH nextStage/previousStage — move entre colunas encadeadas', async () => {
    const u = await registerUser(app, 'tk_move');
    const pr = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(u.token))
      .send({ name: 'Move E2E', description: 'd' })
      .expect(201);
    const projectId = String(pr.body.id);
    const s1 = await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(u.token))
      .send({ name: 'Col A', projectId, order: 0 })
      .expect(201);
    const id1 = String(s1.body.id);
    const s2 = await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(u.token))
      .send({
        name: 'Col B',
        projectId,
        order: 1,
        prevStageId: id1,
      })
      .expect(201);
    const id2 = String(s2.body.id);

    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(u.token))
      .send({ name: 'Mover', stageId: id1 })
      .expect(201);
    const taskId = String(taskRes.body.id);

    const fwd = await request(app.getHttpServer())
      .patch(`/tasks/nextStage/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(String(fwd.body.stage.id)).toBe(id2);

    const back = await request(app.getHttpServer())
      .patch(`/tasks/previousStage/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(String(back.body.stage.id)).toBe(id1);

    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('PATCH e DELETE timetrack — atualizar fim e remover registro', async () => {
    const u = await registerUser(app, 'tk_trk');
    const { stageId } = await seedProjectWithStage(app, u.token);
    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(u.token))
      .send({ name: 'Timer E2E', stageId })
      .expect(201);
    const taskId = String(taskRes.body.id);

    const track = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/timetrack/start`)
      .set(authHeader(u.token))
      .send({})
      .expect(201);
    const trackId = String(track.body.id);

    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/timetrack/${trackId}`)
      .set(authHeader(u.token))
      .send({ end: '2025-06-15T14:30:00.000Z' })
      .expect(200);

    const del = await request(app.getHttpServer())
      .delete(`/tasks/${taskId}/timetrack/${trackId}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(del.body).toMatchObject({ deleted: true });

    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
  });
});
