import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { E2E_PASSWORD } from './e2e-constants';
import { PostgreSQLTokens } from '../../src/repository/postgresql.enums';
import { User } from '../../src/users/entities/User.entity';
import { UserRole } from '../../src/users/user-role.enum';
import { Repository } from 'typeorm';

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

export async function registerAdminUser(
  app: INestApplication,
  suffix: string,
): Promise<RegisteredUser> {
  const user = await registerUser(app, suffix);
  await setUserRole(app, user.id, UserRole.ADMIN_GOD);
  return user;
}

export async function setUserRole(
  app: INestApplication,
  userId: string,
  role: UserRole,
) {
  const repo = app.get<Repository<User>>(PostgreSQLTokens.USER_REPOSITORY);
  await repo.update(userId, { role });
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
