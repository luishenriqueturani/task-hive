import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JWTAudience } from "src/auth/auth.enums";
import { AuthService } from "src/auth/auth.service";
import { PERSONAL_ACCESS_TOKEN_PREFIX } from "src/utils/token-hash";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    const raw = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : authorization;

    if (!raw) {
      throw new UnauthorizedException('Não autorizado');
    }

    try {
      request.token = raw;

      if (raw.startsWith(PERSONAL_ACCESS_TOKEN_PREFIX)) {
        const user = await this.authService.authenticatePersonalAccessToken(raw);
        request.user = user;
        request.tokenPayload = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
        return true;
      }

      const payload = this.authService.checkToken(raw, {
        audience: JWTAudience.LOGIN,
        issuer: 'TaskHive',
      });

      request.tokenPayload = payload;

      const session = await this.authService.findSessionByToken(raw);

      if (!session) {
        throw new UnauthorizedException('Não autorizado');
      }

      request.session = session;
      request.user = session.user;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Não autorizado');
    }
  }
}
