import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { E2E_PASSWORD, E2E_PASSWORD_ALT } from './helpers/e2e-constants';
import { authHeader, registerUser } from './helpers/e2e-auth';

describe('Auth (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /auth/login — 422 sem email', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: E2E_PASSWORD })
      .expect(422);
  });

  it('POST /auth/login — 422 senha fraca', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'a@b.com', password: '123' })
      .expect(422);
  });

  it('POST /auth/login — 400 credenciais inválidas', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'naoexiste@example.com', password: E2E_PASSWORD })
      .expect(400);
  });

  it('POST /auth/login — 200 retorna token e user', async () => {
    const u = await registerUser(app, 'auth_login');
    expect(u.token).toBeDefined();
    expect(u.id).toBeDefined();
  });

  it('POST /auth/logout — 403 sem Authorization (guard)', () => {
    return request(app.getHttpServer()).post('/auth/logout').expect(403);
  });

  it('POST /auth/logout — 200 invalida sessão', async () => {
    const u = await registerUser(app, 'auth_logout');
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set(authHeader(u.token))
      .expect(201);
    await request(app.getHttpServer())
      .get('/users')
      .set(authHeader(u.token))
      .expect(403);
  });

  it('POST /auth/forget-password — 422 email inválido', () => {
    return request(app.getHttpServer())
      .post('/auth/forget-password')
      .send({ email: 'invalid' })
      .expect(422);
  });

  it('POST /auth/check-token — 422 token não-JWT', () => {
    return request(app.getHttpServer())
      .post('/auth/check-token')
      .send({ token: 'not-a-jwt' })
      .expect(422);
  });

  it('POST /auth/forget-password — 400 usuário inexistente', () => {
    return request(app.getHttpServer())
      .post('/auth/forget-password')
      .send({ email: 'ninguem_existe_aqui@example.com' })
      .expect(400);
  });

  it('POST /auth/reset-password — 422 confirmPassword diferente', () => {
    return request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({
        password: E2E_PASSWORD_ALT,
        confirmPassword: E2E_PASSWORD,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      })
      .expect(422);
  });
});
