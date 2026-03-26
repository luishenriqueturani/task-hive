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
});
