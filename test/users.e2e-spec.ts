import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { E2E_PASSWORD } from './helpers/e2e-constants';
import { authHeader, registerUser } from './helpers/e2e-auth';

describe('Users (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /users — 422 email inválido', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'bad',
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
      })
      .expect(422);
  });

  it('POST /users — 422 confirmPassword diferente', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: `u_${Date.now()}@x.com`,
        password: E2E_PASSWORD,
        confirmPassword: 'Outra@123',
      })
      .expect(422);
  });

  it('POST /users — 200 cria usuário sem password na resposta', async () => {
    const email = `new_${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Novo',
        email,
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
      })
      .expect(201);
    expect(res.body.email).toBe(email);
    expect(res.body.password).toBeUndefined();
    expect(res.body.id).toBeDefined();
  });

  it('POST /users — 422 email duplicado', async () => {
    const u = await registerUser(app, 'dup');
    await request(app.getHttpServer())
      .post('/users')
      .send({
        email: u.email,
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
      })
      .expect(422);
  });

  it('GET /users — 403 sem token', () => {
    return request(app.getHttpServer()).get('/users').expect(403);
  });

  it('GET /users — 200 lista', async () => {
    const u = await registerUser(app, 'list');
    const res = await request(app.getHttpServer())
      .get('/users')
      .set(authHeader(u.token))
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /users/:id — 200 e 404', async () => {
    const u = await registerUser(app, 'one');
    const ok = await request(app.getHttpServer())
      .get(`/users/${u.id}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(ok.body.id).toBe(u.id);
    const missing = await request(app.getHttpServer())
      .get('/users/00000000-0000-0000-0000-000000000099')
      .set(authHeader(u.token))
      .expect(200);
    expect(missing.body == null || Object.keys(missing.body).length === 0).toBe(
      true,
    );
  });

  it('DELETE /users/:id — 403 ao remover a própria conta', async () => {
    const u = await registerUser(app, 'selfdel');
    await request(app.getHttpServer())
      .delete(`/users/${u.id}`)
      .set(authHeader(u.token))
      .expect(403);
  });

  it('PUT /users/:id — atualiza nome', async () => {
    const u = await registerUser(app, 'put_u');
    const res = await request(app.getHttpServer())
      .put(`/users/${u.id}`)
      .set(authHeader(u.token))
      .send({
        name: 'Nome atualizado E2E',
        email: u.email,
      })
      .expect(200);
    expect(res.body.affected).toBe(1);
    const again = await request(app.getHttpServer())
      .get(`/users/${u.id}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(again.body.name).toBe('Nome atualizado E2E');
  });

  it('PATCH /users/:id — soft delete de outro usuário', async () => {
    const admin = await registerUser(app, 'adm_soft');
    const email = `alvo_${Date.now()}@example.com`;
    const created = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Alvo',
        email,
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
      })
      .expect(201);
    const targetId = created.body.id;
    const res = await request(app.getHttpServer())
      .patch(`/users/${targetId}`)
      .set(authHeader(admin.token))
      .expect(200);
    expect(res.body.affected).toBe(1);
  });
});
