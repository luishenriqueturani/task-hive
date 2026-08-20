import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { E2E_PASSWORD } from './helpers/e2e-constants';
import { authHeader, registerAdminUser, registerUser } from './helpers/e2e-auth';

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

  it('GET /users — 401 sem token', () => {
    return request(app.getHttpServer()).get('/users').expect(401);
  });

  it('GET /users — 403 para CLIENT', async () => {
    const u = await registerUser(app, 'list_client');
    await request(app.getHttpServer())
      .get('/users')
      .set(authHeader(u.token))
      .expect(403);
  });

  it('GET /users — 200 para admin', async () => {
    const admin = await registerAdminUser(app, 'list_admin');
    const res = await request(app.getHttpServer())
      .get('/users')
      .set(authHeader(admin.token))
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /users/search — busca por e-mail', async () => {
    const u = await registerUser(app, 'search_tgt');
    const seeker = await registerUser(app, 'search_seek');
    const res = await request(app.getHttpServer())
      .get(`/users/search?q=${encodeURIComponent(u.email.split('@')[0])}`)
      .set(authHeader(seeker.token))
      .expect(200);
    expect(res.body.some((row: { id: string }) => row.id === u.id)).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('GET /users/:id — próprio perfil e 404 para outro', async () => {
    const u = await registerUser(app, 'one');
    const other = await registerUser(app, 'one_other');
    const ok = await request(app.getHttpServer())
      .get(`/users/${u.id}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(ok.body.id).toBe(u.id);
    await request(app.getHttpServer())
      .get(`/users/${other.id}`)
      .set(authHeader(u.token))
      .expect(404);
    await request(app.getHttpServer())
      .get('/users/00000000-0000-0000-0000-000000000099')
      .set(authHeader(u.token))
      .expect(404);
  });

  it('DELETE /users/:id — 403 ao remover a própria conta', async () => {
    const u = await registerUser(app, 'selfdel');
    await request(app.getHttpServer())
      .delete(`/users/${u.id}`)
      .set(authHeader(u.token))
      .expect(403);
  });

  it('PUT /users/:id — atualiza próprio nome', async () => {
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

  it('PUT /users/:id — 404 ao alterar outro utilizador', async () => {
    const u = await registerUser(app, 'put_self');
    const victim = await registerUser(app, 'put_victim');
    await request(app.getHttpServer())
      .put(`/users/${victim.id}`)
      .set(authHeader(u.token))
      .send({
        name: 'Hack',
        email: victim.email,
      })
      .expect(404);
  });

  it('PATCH /users/:id — soft delete só admin', async () => {
    const admin = await registerAdminUser(app, 'adm_soft');
    const target = await registerUser(app, 'soft_tgt');
    const client = await registerUser(app, 'soft_client');
    await request(app.getHttpServer())
      .patch(`/users/${target.id}`)
      .set(authHeader(client.token))
      .expect(404);
    const res = await request(app.getHttpServer())
      .patch(`/users/${target.id}`)
      .set(authHeader(admin.token))
      .expect(200);
    expect(res.body.affected).toBe(1);
  });
});
