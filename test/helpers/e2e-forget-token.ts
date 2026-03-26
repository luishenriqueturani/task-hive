import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ForgetPassword } from 'src/auth/entities/ForgetPassword.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';

/** Lê o token JWT mais recente de reset guardado após `POST /auth/forget-password`. */
export async function getLatestForgetPasswordToken(
  app: INestApplication,
  userId: string,
): Promise<string> {
  const repo = app.get<Repository<ForgetPassword>>(
    PostgreSQLTokens.FORGET_PASSWORD,
  );
  const rows = await repo.find({
    where: { user: { id: userId } },
    order: { id: 'DESC' },
    take: 1,
    relations: ['user'],
  });
  const token = rows[0]?.token;
  if (!token) {
    throw new Error('Nenhum registro ForgetPassword para o utilizador');
  }
  return token;
}
