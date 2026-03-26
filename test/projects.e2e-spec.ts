import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';

describe('Projects (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /projects — 403 sem token', () => {
    return request(app.getHttpServer()).get('/projects').expect(403);
  });

  it('POST /projects — 422 sem name', async () => {
    const u = await registerUser(app, 'pr_val');
    await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(u.token))
      .send({ description: 'x' })
      .expect(422);
  });

  it('CRUD e participantes — fluxo feliz e 403 participante', async () => {
    const owner = await registerUser(app, 'pr_owner');
    const other = await registerUser(app, 'pr_other');

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(owner.token))
      .send({ name: 'Proj E2E', description: 'desc' })
      .expect(201);
    expect(created.body.name).toBe('Proj E2E');
    const projectId = String(created.body.id);

    const list = await request(app.getHttpServer())
      .get('/projects')
      .set(authHeader(owner.token))
      .expect(200);
    expect(list.body.some((p: { id: string }) => String(p.id) === projectId)).toBe(
      true,
    );

    const one = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(authHeader(owner.token))
      .expect(200);
    expect(String(one.body.id)).toBe(projectId);

    let parts = await request(app.getHttpServer())
      .get(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .expect(200);
    expect(Array.isArray(parts.body)).toBe(true);

    parts = await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: other.id })
      .expect(201);
    expect(parts.body.some((p: { id: string }) => p.id === other.id)).toBe(true);

    parts = await request(app.getHttpServer())
      .delete(`/projects/${projectId}/participants/${other.id}`)
      .set(authHeader(owner.token))
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set(authHeader(other.token))
      .send({ name: 'Hack' })
      .expect(403);

    const upd = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set(authHeader(owner.token))
      .send({ name: 'Proj Atualizado' })
      .expect(200);
    expect(upd.body.name).toBe('Proj Atualizado');

    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set(authHeader(owner.token))
      .expect(200);
  });

  it('GET /projects/:id/participants — 404 projeto inexistente', async () => {
    const u = await registerUser(app, 'pr_nf');
    await request(app.getHttpServer())
      .get('/projects/1/participants')
      .set(authHeader(u.token))
      .expect(404);
  });

  it('POST participante — 400 duplicado e 400 dono como participante', async () => {
    const owner = await registerUser(app, 'pr_dup');
    const peer = await registerUser(app, 'pr_peer');
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(owner.token))
      .send({ name: 'Dup E2E', description: 'd' })
      .expect(201);
    const projectId = String(created.body.id);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: peer.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: peer.id })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: owner.id })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set(authHeader(owner.token))
      .expect(200);
  });

  it('DELETE participante — 403 quando quem pede não é gestor', async () => {
    const owner = await registerUser(app, 'pr_del_o');
    const a = await registerUser(app, 'pr_del_a');
    const b = await registerUser(app, 'pr_del_b');
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set(authHeader(owner.token))
      .send({ name: 'DelPart E2E', description: 'd' })
      .expect(201);
    const projectId = String(created.body.id);

    await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: a.id })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/participants`)
      .set(authHeader(owner.token))
      .send({ userId: b.id })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/projects/${projectId}/participants/${b.id}`)
      .set(authHeader(a.token))
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set(authHeader(owner.token))
      .expect(200);
  });
});
