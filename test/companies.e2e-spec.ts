import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';

describe('Companies (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /companies — 403 sem token', () => {
    return request(app.getHttpServer()).get('/companies').expect(403);
  });

  it('POST /companies — 422 nome vazio / inválido', async () => {
    const u = await registerUser(app, 'co_val');
    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(u.token))
      .send({})
      .expect(422);
  });

  it('POST/GET/PATCH/DELETE /companies — fluxo feliz', async () => {
    const u = await registerUser(app, 'co_crud');
    const create = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(u.token))
      .send({ name: 'Empresa E2E' })
      .expect(201);
    expect(create.body.name).toBe('Empresa E2E');
    expect(create.body.id).toBeDefined();

    const id = create.body.id;
    const list = await request(app.getHttpServer())
      .get('/companies')
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    const one = await request(app.getHttpServer())
      .get(`/companies/${id}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(one.body.id).toBe(id);

    const upd = await request(app.getHttpServer())
      .patch(`/companies/${id}`)
      .set(authHeader(u.token))
      .send({ name: 'Empresa Atualizada' })
      .expect(200);
    expect(upd.body.name).toBe('Empresa Atualizada');

    await request(app.getHttpServer())
      .delete(`/companies/${id}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('PATCH /companies/:id — 404', async () => {
    const u = await registerUser(app, 'co_404');
    await request(app.getHttpServer())
      .patch('/companies/00000000-0000-0000-0000-000000000099')
      .set(authHeader(u.token))
      .send({ name: 'X' })
      .expect(404);
  });
});
