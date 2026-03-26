import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2E_PASSWORD } from './e2e-constants';

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

export async function registerUser(
  app: INestApplication,
  suffix: string,
): Promise<RegisteredUser> {
  const email = `e2e_${suffix}_${Date.now()}@example.com`;
  const res = await request(app.getHttpServer())
    .post('/users')
    .send({
      name: `User ${suffix}`,
      email,
      password: E2E_PASSWORD,
      confirmPassword: E2E_PASSWORD,
    })
    .expect(201);

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: E2E_PASSWORD })
    .expect(201);

  expect(login.body).toHaveProperty('token');
  expect(login.body).toHaveProperty('user');
  expect(login.body.user.password).toBeUndefined();

  return {
    id: login.body.user.id,
    email,
    name: login.body.user.name,
    token: login.body.token,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
