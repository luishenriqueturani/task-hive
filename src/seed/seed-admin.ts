import { execSync } from 'node:child_process';
import dataSource from '../typeorm-datasource';
import { User } from '../users/entities/User.entity';
import { UserRole } from '../users/user-role.enum';
import { Crypt } from '../utils/crypt';

function gitConfig(key: 'user.name' | 'user.email'): string | undefined {
  try {
    const v = execSync(`git config ${key}`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    }).trim();
    return v || undefined;
  } catch {
    return undefined;
  }
}

function defaultEmailFromName(name: string): string {
  const slug =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '') || 'admin';
  return `${slug}@task-hive.local`;
}

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.error(
      'Define SEED_ADMIN_PASSWORD no ambiente ou no .env (ex.: npm run seed:admin).',
    );
    process.exit(1);
  }

  const name =
    process.env.SEED_ADMIN_NAME?.trim() ||
    gitConfig('user.name') ||
    'Administrador';
  const email =
    process.env.SEED_ADMIN_EMAIL?.trim() ||
    gitConfig('user.email') ||
    defaultEmailFromName(name);

  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log(`Utilizador já existe (${email}). Nada a fazer.`);
    await dataSource.destroy();
    process.exit(0);
  }

  const user = repo.create({
    name,
    email,
    password: await Crypt.hash(password),
    role: UserRole.ADMIN_GOD,
  });
  await repo.save(user);
  console.log(`Admin criado: ${name} <${email}> (ADMIN_GOD).`);
  await dataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
