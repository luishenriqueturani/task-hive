import { Logger } from '@nestjs/common';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { buildSwaggerDocument } from '../openapi/swagger-document';

const logger = new Logger('OpenApiGenerate');

async function main() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  try {
    const document = buildSwaggerDocument(app);
    const dir = join(process.cwd(), 'openapi');
    mkdirSync(dir, { recursive: true });
    const outPath = join(dir, 'openapi.json');
    writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    logger.log(`OpenAPI escrito em ${outPath}`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  logger.error(
    'Falha ao gerar OpenAPI (a app precisa de PostgreSQL acessível com o .env atual). ' +
      'Alternativa com a API já a correr: npm run openapi:pull',
  );
  logger.error(err?.message ?? err);
  process.exit(1);
});
