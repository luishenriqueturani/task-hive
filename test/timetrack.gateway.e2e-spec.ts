import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { io } from 'socket.io-client';
import { createE2eApplication, getE2eBaseUrl } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';
import { TIMETRACK_EVENTS } from 'src/tasks/timetrack.gateway';

function waitForConnect(client: ReturnType<typeof io>): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('socket connect timeout')), 10000);
    client.once('connect', () => {
      clearTimeout(t);
      resolve();
    });
    client.once('connect_error', (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

function onceSocketEvent<T = Record<string, unknown>>(
  client: ReturnType<typeof io>,
  event: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`socket event timeout: ${event}`)),
      10000,
    );
    client.once(event, (data: T) => {
      clearTimeout(t);
      resolve(data);
    });
  });
}

describe('TimetrackGateway (e2e / Socket.IO)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('emite timetrack:started ao iniciar timer via HTTP', async () => {
    const u = await registerUser(app, 'ws_tt');
    const pr = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(u.token))
      .send({ name: 'WS Proj', description: 'd' })
      .expect(201);
    const st = await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(u.token))
      .send({
        name: 'Col',
        projectId: String(pr.body.id),
        order: 0,
      })
      .expect(201);
    const task = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(u.token))
      .send({ name: 'WS Task', stageId: String(st.body.id) })
      .expect(201);
    const taskId = String(task.body.id);

    const baseUrl = getE2eBaseUrl(app);
    const client = io(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
    });
    await waitForConnect(client);

    client.emit('joinTask', { taskId });

    const payloadPromise = new Promise<Record<string, unknown>>((resolve) => {
      client.once(TIMETRACK_EVENTS.STARTED, (data: Record<string, unknown>) => {
        resolve(data);
      });
    });

    await request(app.getHttpServer())
      .post(`/tasks/${taskId}/timetrack/start`)
      .set(authHeader(u.token))
      .send({})
      .expect(201);

    const payload = await payloadPromise;
    expect(payload.taskId).toBe(taskId);
    expect(payload.userId).toBe(u.id);

    client.disconnect();
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('emite timetrack:stopped, updated e deleted após HTTP correspondente', async () => {
    const u = await registerUser(app, 'ws_tt2');
    const pr = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(u.token))
      .send({ name: 'WS Proj2', description: 'd' })
      .expect(201);
    const st = await request(app.getHttpServer())
      .post('/project-stages')
      .set(authHeader(u.token))
      .send({
        name: 'Col2',
        projectId: String(pr.body.id),
        order: 0,
      })
      .expect(201);
    const task = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(u.token))
      .send({ name: 'WS Task2', stageId: String(st.body.id) })
      .expect(201);
    const taskId = String(task.body.id);

    const baseUrl = getE2eBaseUrl(app);
    const client = io(baseUrl, {
      transports: ['websocket'],
      forceNew: true,
    });
    await waitForConnect(client);
    client.emit('joinTask', { taskId });

    const startedP = onceSocketEvent(client, TIMETRACK_EVENTS.STARTED);
    const startRes = await request(app.getHttpServer())
      .post(`/tasks/${taskId}/timetrack/start`)
      .set(authHeader(u.token))
      .send({})
      .expect(201);
    const trackId = String(startRes.body.id);
    const started = await startedP;
    expect(started.taskId).toBe(taskId);

    const stoppedP = onceSocketEvent(client, TIMETRACK_EVENTS.STOPPED);
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/timetrack/${trackId}/stop`)
      .set(authHeader(u.token))
      .expect(200);
    const stopped = await stoppedP;
    expect(stopped.taskId).toBe(taskId);
    expect(stopped.id).toBe(trackId);

    const updatedP = onceSocketEvent(client, TIMETRACK_EVENTS.UPDATED);
    await request(app.getHttpServer())
      .patch(`/tasks/${taskId}/timetrack/${trackId}`)
      .set(authHeader(u.token))
      .send({ end: '2025-07-01T12:00:00.000Z' })
      .expect(200);
    const updated = await updatedP;
    expect(updated.taskId).toBe(taskId);

    const deletedP = onceSocketEvent(client, TIMETRACK_EVENTS.DELETED);
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}/timetrack/${trackId}`)
      .set(authHeader(u.token))
      .expect(200);
    const deleted = await deletedP;
    expect(deleted.taskId).toBe(taskId);
    expect(deleted.id).toBe(trackId);

    client.disconnect();
    await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .set(authHeader(u.token))
      .expect(200);
  });
});
