import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { io } from 'socket.io-client';
import { createE2eApplication, getE2eBaseUrl } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';
import { E2E_PASSWORD } from './helpers/e2e-constants';
import {
  assertNoPasswordInBody,
  seedProjectGraph,
} from './helpers/e2e-seed';
import { TIMETRACK_EVENTS } from 'src/tasks/timetrack.gateway';

describe('Authorization A≠B (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('login — resposta nunca inclui password', async () => {
    const user = await registerUser(app, 'auth_pw');
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: E2E_PASSWORD })
      .expect(201);
    assertNoPasswordInBody(login.body);
  });

  it('GET /projects — B não vê projectos de A', async () => {
    const userA = await registerUser(app, 'auth_pr_a');
    const userB = await registerUser(app, 'auth_pr_b');

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(userA.token))
      .send({ name: 'Privado A', description: 'd' })
      .expect(201);
    const projectId = String(created.body.id);

    const listB = await request(app.getHttpServer())
      .get('/projects')
      .set(authHeader(userB.token))
      .expect(200);
    expect(
      listB.body.some((p: { id: string }) => String(p.id) === projectId),
    ).toBe(false);
    assertNoPasswordInBody(listB.body);
  });

  it('project graph — B recebe 404/403 em leituras e mutações alheias', async () => {
    const owner = await registerUser(app, 'auth_graph_o');
    const stranger = await registerUser(app, 'auth_graph_s');
    const graph = await seedProjectGraph(app, owner.token);

    await request(app.getHttpServer())
      .get(`/projects/${graph.projectId}`)
      .set(authHeader(stranger.token))
      .expect(404);

    await request(app.getHttpServer())
      .get(`/project-stages/${graph.stageId}`)
      .set(authHeader(stranger.token))
      .expect(404);

    await request(app.getHttpServer())
      .get(`/tasks/${graph.taskId}`)
      .set(authHeader(stranger.token))
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/tasks/${graph.taskId}`)
      .set(authHeader(stranger.token))
      .send({ name: 'Hack' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/tasks/${graph.taskId}`)
      .set(authHeader(stranger.token))
      .expect(404);

    await request(app.getHttpServer())
      .get(`/subtasks/${graph.subtaskId}`)
      .set(authHeader(stranger.token))
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/subtasks/${graph.subtaskId}`)
      .set(authHeader(stranger.token))
      .send({ name: 'Hack sub' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/subtasks/${graph.subtaskId}`)
      .set(authHeader(stranger.token))
      .expect(404);
  });

  it('to-do — B não acede mutações da tarefa avulsa de A', async () => {
    const owner = await registerUser(app, 'auth_todo_o');
    const stranger = await registerUser(app, 'auth_todo_s');

    const created = await request(app.getHttpServer())
      .post('/to-do')
      .set(authHeader(owner.token))
      .send({
        title: 'Privada todo',
        description: 'Descrição com tamanho mínimo ok',
      })
      .expect(201);
    const id = String(created.body.id);

    const listB = await request(app.getHttpServer())
      .get('/to-do')
      .set(authHeader(stranger.token))
      .expect(200);
    expect(listB.body.some((t: { id: string }) => String(t.id) === id)).toBe(
      false,
    );

    await request(app.getHttpServer())
      .put(`/to-do/${id}`)
      .set(authHeader(stranger.token))
      .send({
        title: 'Hack todo',
        description: 'Descrição com tamanho mínimo ok',
      })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/to-do/status/${id}`)
      .set(authHeader(stranger.token))
      .send({ status: 'TODO' })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/to-do/end/${id}`)
      .set(authHeader(stranger.token))
      .expect(404);
  });

  it('PAT — B não revoga token de A', async () => {
    const userA = await registerUser(app, 'auth_pat_a');
    const userB = await registerUser(app, 'auth_pat_b');

    const created = await request(app.getHttpServer())
      .post('/personal-access-tokens')
      .set(authHeader(userA.token))
      .send({ name: 'Agente CI' })
      .expect(201);
    assertNoPasswordInBody(created.body);
    expect(created.body.token).toMatch(/^th_pat_/);

    const listA = await request(app.getHttpServer())
      .get('/personal-access-tokens')
      .set(authHeader(userA.token))
      .expect(200);
    expect(listA.body.some((t: { id: string }) => t.id === created.body.id)).toBe(
      true,
    );

    const listB = await request(app.getHttpServer())
      .get('/personal-access-tokens')
      .set(authHeader(userB.token))
      .expect(200);
    expect(listB.body.some((t: { id: string }) => t.id === created.body.id)).toBe(
      false,
    );

    await request(app.getHttpServer())
      .delete(`/personal-access-tokens/${created.body.id}`)
      .set(authHeader(userB.token))
      .expect(403);
  });

  it('WebSocket joinTask — B com token válido não recebe eventos de A', async () => {
    const owner = await registerUser(app, 'auth_ws_o');
    const stranger = await registerUser(app, 'auth_ws_s');
    const graph = await seedProjectGraph(app, owner.token);

    const baseUrl = getE2eBaseUrl(app);
    const client = io(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
      auth: { token: stranger.token },
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('connect timeout')), 10000);
      client.once('connect', () => {
        clearTimeout(t);
        resolve();
      });
      client.once('connect_error', (err) => {
        clearTimeout(t);
        reject(err);
      });
    });

    client.emit('joinTask', { taskId: graph.taskId });

    let received = false;
    client.on(TIMETRACK_EVENTS.STARTED, () => {
      received = true;
    });

    await request(app.getHttpServer())
      .post(`/tasks/${graph.taskId}/timetrack/start`)
      .set(authHeader(owner.token))
      .send({})
      .expect(201);

    await new Promise((r) => setTimeout(r, 500));
    expect(received).toBe(false);

    client.disconnect();
  });
});
