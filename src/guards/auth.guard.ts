import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JWTAudience } from "src/auth/auth.enums";
import { AuthService } from "src/auth/auth.service";

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
