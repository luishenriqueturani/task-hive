import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { authHeader, registerUser } from './helpers/e2e-auth';

describe('To-do (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /to-do — 403 sem token', () => {
    return request(app.getHttpServer()).get('/to-do').expect(403);
  });

  it('POST /to-do — 422 título curto', async () => {
    const u = await registerUser(app, 'td_val');
    await request(app.getHttpServer())
      .post('/to-do')
      .set(authHeader(u.token))
      .send({
        title: 'ab',
        description: 'Descrição válida com mais de três chars',
      })
      .expect(422);
  });

  it('CRUD e status — fluxo feliz', async () => {
    const u = await registerUser(app, 'td_flow');
    const created = await request(app.getHttpServer())
      .post('/to-do')
      .set(authHeader(u.token))
      .send({
        title: 'Comprar leite',
        description: 'Na padaria da esquina',
        isRecurring: false,
      })
      .expect(201);
    const id = String(created.body.id);
    expect(created.body.title).toBe('Comprar leite');

    const list = await request(app.getHttpServer())
      .get('/to-do')
      .set(authHeader(u.token))
      .expect(200);
    expect(list.body.some((t: { id: string }) => String(t.id) === id)).toBe(true);

    const one = await request(app.getHttpServer())
      .get(`/to-do/${id}`)
      .set(authHeader(u.token))
      .expect(200);
    expect(String(one.body.id)).toBe(id);

    await request(app.getHttpServer())
      .patch(`/to-do/status/${id}`)
      .set(authHeader(u.token))
      .send({ status: 'TODO' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/to-do/end/${id}`)
      .set(authHeader(u.token))
      .expect(200);

    await request(app.getHttpServer())
      .put(`/to-do/${id}`)
      .set(authHeader(u.token))
      .send({
        title: 'Comprar leite desnatado',
        description: 'Atualizado com mais detalhes aqui',
      })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/to-do/${id}`)
      .set(authHeader(u.token))
      .expect(200);
  });

  it('PATCH /to-do/status/:id — 422 enum inválido', async () => {
    const u = await registerUser(app, 'td_st');
    const created = await request(app.getHttpServer())
      .post('/to-do')
      .set(authHeader(u.token))
      .send({
        title: 'Item status',
        description: 'Descrição longa o suficiente',
      })
      .expect(201);
    const id = String(created.body.id);
    await request(app.getHttpServer())
      .patch(`/to-do/status/${id}`)
      .set(authHeader(u.token))
      .send({ status: 'INVALID' })
      .expect(422);
  });

  it('PATCH /to-do/nextDateRecurring/:id — avança recorrência', async () => {
    const u = await registerUser(app, 'td_rec');
    const created = await request(app.getHttpServer())
      .post('/to-do')
      .set(authHeader(u.token))
      .send({
        title: 'Hábito semanal',
        description: 'Descrição com tamanho mínimo ok',
        isRecurring: true,
        recurringType: 'WEEKLY',
      })
      .expect(201);
    const id = String(created.body.id);
    await request(app.getHttpServer())
      .patch(`/to-do/nextDateRecurring/${id}`)
      .set(authHeader(u.token))
      .expect(200);
  });
});
