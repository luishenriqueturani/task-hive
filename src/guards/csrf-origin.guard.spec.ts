import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfOriginGuard } from './csrf-origin.guard';

describe('CsrfOriginGuard', () => {
  const guard = new CsrfOriginGuard();
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CSRF_ORIGIN_CHECK;
    delete process.env.CSRF_ALLOWED_ORIGINS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function context(headers: Record<string, string | undefined>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as ExecutionContext;
  }

  it('permite pedidos sem Origin/Referer (E2E, BFF interno)', () => {
    expect(guard.canActivate(context({}))).toBe(true);
  });

  it('bloqueia Origin fora da allowlist', () => {
    process.env.CSRF_ALLOWED_ORIGINS = 'http://127.0.0.1:8080';
    expect(() =>
      guard.canActivate(context({ origin: 'http://evil.example' })),
    ).toThrow(ForbiddenException);
  });

  it('permite Origin na allowlist', () => {
    process.env.CSRF_ALLOWED_ORIGINS = 'http://127.0.0.1:8080';
    expect(
      guard.canActivate(context({ origin: 'http://127.0.0.1:8080' })),
    ).toBe(true);
  });

  it('desactiva com CSRF_ORIGIN_CHECK=false', () => {
    process.env.CSRF_ALLOWED_ORIGINS = 'http://127.0.0.1:8080';
    process.env.CSRF_ORIGIN_CHECK = 'false';
    expect(
      guard.canActivate(context({ origin: 'http://evil.example' })),
    ).toBe(true);
  });
});
