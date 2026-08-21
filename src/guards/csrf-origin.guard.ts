import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';

/**
 * Valida Origin/Referer em mutações públicas (login, registo).
 * Sem headers → permite (E2E, BFF interno, curl). Com headers → exige allowlist.
 */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  private readonly logger = new Logger(CsrfOriginGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const disabled = process.env.CSRF_ORIGIN_CHECK?.trim().toLowerCase();
    if (disabled === 'false' || disabled === '0') return true;

    const request = context.switchToHttp().getRequest<{
      headers: { origin?: string; referer?: string };
    }>();
    const origin = request.headers.origin?.trim();
    const referer = request.headers.referer?.trim();

    if (!origin && !referer) return true;

    const allowed = this.allowedOrigins();
    if (allowed.length === 0) return true;

    if (origin && this.isAllowedOrigin(origin, allowed)) return true;
    if (referer && this.refererAllowed(referer, allowed)) return true;

    this.logger.warn(
      `Origem bloqueada (CSRF): origin=${origin ?? '-'} referer=${referer ?? '-'}`,
    );
    throw new ForbiddenException('Origem da requisição não permitida.');
  }

  private allowedOrigins(): string[] {
    const raw = process.env.CSRF_ALLOWED_ORIGINS?.trim();
    if (!raw) return [];
    return raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  private isAllowedOrigin(origin: string, allowed: string[]): boolean {
    return allowed.some((entry) => origin === entry);
  }

  private refererAllowed(referer: string, allowed: string[]): boolean {
    try {
      const url = new URL(referer);
      return this.isAllowedOrigin(`${url.protocol}//${url.host}`, allowed);
    } catch {
      return false;
    }
  }
}
