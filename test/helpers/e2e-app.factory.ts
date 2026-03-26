import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from '../../src/app.module';

export async function createE2eApplication(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: 422,
    }),
  );
  await app.init();
  await app.listen(0);
  return app;
}

export function getE2eBaseUrl(app: INestApplication): string {
  const server = app.getHttpServer();
  const addr = server.address();
  if (addr && typeof addr === 'object') {
    return `http://127.0.0.1:${addr.port}`;
  }
  throw new Error('Could not resolve E2E server address');
}
