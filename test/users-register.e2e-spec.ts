import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createE2eApplication } from './helpers/e2e-app.factory';
import { E2E_PASSWORD } from './helpers/e2e-constants';
import { authHeader } from './helpers/e2e-auth';
import { isValidCnpj } from '../src/utils/br-documents';

function uniqueCnpj(): string {
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const digit = (digits: string, weights: number[]) => {
    const sum = digits
      .split('')
      .reduce((acc, ch, i) => acc + Number(ch) * (weights[i] ?? 0), 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const base = `${Date.now()}`.padStart(12, '2').slice(-12);
  const d1 = digit(base, w1);
  const d2 = digit(`${base}${d1}`, w2);
  const cnpj = `${base}${d1}${d2}`;
  if (!isValidCnpj(cnpj)) {
    throw new Error(`CNPJ de teste inválido: ${cnpj}`);
  }
  return cnpj;
}

describe('Users register PF/CNPJ (e2e)', () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await createE2eApplication();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /users PF — accountKind INDIVIDUAL no GET /users/:id', async () => {
    const email = `e2e_pf_${Date.now()}@example.com`;
    const created = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ana PF',
        email,
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
        accountKind: 'INDIVIDUAL',
      })
      .expect(201);

    expect(created.body.accountKind).toBe('INDIVIDUAL');
    expect(created.body.company).toBeNull();
    expect(created.body.password).toBeUndefined();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: E2E_PASSWORD })
      .expect(201);

    const me = await request(app.getHttpServer())
      .get(`/users/${created.body.id}`)
      .set(authHeader(login.body.token))
      .expect(200);

    expect(me.body.accountKind).toBe('INDIVIDUAL');
    expect(me.body.company).toBeNull();
  });

  it('POST /users CNPJ — cria empresa do responsável', async () => {
    const email = `e2e_pj_${Date.now()}@example.com`;
    const document = uniqueCnpj();
    const created = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ana PJ',
        email,
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
        accountKind: 'COMPANY',
        company: {
          legalName: 'Acme Tecnologia Ltda',
          tradeName: 'Acme',
          document,
        },
      })
      .expect(201);

    expect(created.body.accountKind).toBe('COMPANY');
    expect(created.body.company).toMatchObject({
      legalName: 'Acme Tecnologia Ltda',
      tradeName: 'Acme',
      document,
    });
  });

  it('POST /users CNPJ — 400 com CNPJ inválido', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ana PJ',
        email: `e2e_pj_bad_${Date.now()}@example.com`,
        password: E2E_PASSWORD,
        confirmPassword: E2E_PASSWORD,
        accountKind: 'COMPANY',
        company: {
          legalName: 'Acme Ltda',
          document: '11111111111111',
        },
      })
      .expect(400);
  });
});
