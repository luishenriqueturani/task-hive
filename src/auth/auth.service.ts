import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { User } from 'src/users/entities/User.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Crypt } from 'src/utils/crypt';
import { Repository } from 'typeorm';
import { JWTAudience } from './auth.enums';
import { ConfigService } from '@nestjs/config';
import { ForgetPassword } from './entities/ForgetPassword.entity';
import { Session } from './entities/Session.entity';
import { RefreshToken } from './entities/RefreshToken.entity';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { GENERIC_AUTH_ERROR, DUMMY_BCRYPT_HASH } from 'src/utils/auth-constants';
import {
  generateRefreshToken,
  hashToken,
  PERSONAL_ACCESS_TOKEN_PREFIX,
} from 'src/utils/token-hash';
import { PersonalAccessToken } from './entities/PersonalAccessToken.entity';

export interface SessionResponse {
  token: string;
  refreshToken: string;
  user: User;
}

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>,

    @Inject(PostgreSQLTokens.FORGET_PASSWORD)
    private forgetPasswordRepository: Repository<ForgetPassword>,

    @Inject(PostgreSQLTokens.SESSION_REPOSITORY)
    private sessionRepository: Repository<Session>,

    @Inject(PostgreSQLTokens.REFRESH_TOKEN_REPOSITORY)
    private refreshTokenRepository: Repository<RefreshToken>,

    @Inject(PostgreSQLTokens.PERSONAL_ACCESS_TOKEN_REPOSITORY)
    private personalAccessTokenRepository: Repository<PersonalAccessToken>,

    private readonly configService: ConfigService,
    private readonly metrics: AppMetricsService,
  ) { }

  async createToken(user: User, audience: JWTAudience, expiresIn?: string) {
    const ttl =
      expiresIn ??
      this.configService.get<string>('jwtAccessExpiresIn') ??
      '1h';
    return this.jwtService.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      {
        subject: user.id,
        issuer: 'TaskHive',
        audience,
        expiresIn: ttl,
        algorithm: 'HS256',
      },
    );
  }

  checkToken(token: string, options?: JwtVerifyOptions) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwtSecret'),
        algorithms: ['HS256'],
        ...options,
      });
    } catch {
      throw new BadRequestException('Token inválido');
    }
  }

  async login(email: string, password: string) {
    return this.metrics.track('auth', 'login', async () => {
      const user = await this.findFirstUserByEmail(email);
      const hash = user?.password ?? DUMMY_BCRYPT_HASH;
      const valid = await Crypt.compare(password, hash);

      if (!user || !valid) {
        throw new BadRequestException(GENERIC_AUTH_ERROR);
      }

      return this.createSession(user);
    });
  }

  async logout(token: string) {
    return this.metrics.track('auth', 'logout', async () => {
      const session = await this.findSessionByToken(token);

      if (!session) {
        throw new BadRequestException('Sessão inválida');
      }

      return this.sessionRepository.delete({ id: session.id });
    });
  }

  async forgetPassword(email: string) {
    return this.metrics.track('auth', 'forget_password', async () => {
      const user = await this.findFirstUserByEmail(email);

      if (!user) {
        await Crypt.compare('dummy-timing', DUMMY_BCRYPT_HASH);
        return true;
      }

      await this.forgetPasswordRepository.delete({ user: { id: user.id } });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      const resetJwt = await this.createToken(
        user,
        JWTAudience.FORGET_PASSWORD,
        '24h',
      );

      await this.forgetPasswordRepository.save({
        user,
        token: resetJwt,
        expiresAt,
      });

      return true;
    });
  }

  async resetPassword(password: string, token: string) {
    return this.metrics.track('auth', 'reset_password', async () => {
      const fp = await this.findValidForgetPassword(token);

      if (!fp) {
        throw new BadRequestException('Token inválido');
      }

      const user = await this.userRepository.findOne({
        where: { id: fp.user.id },
      });

      if (!user) {
        throw new BadRequestException('Token inválido');
      }

      const hashed = await Crypt.hash(password);
      const update = await this.userRepository.update(fp.user.id, {
        password: hashed,
      });

      if (!update.affected) {
        throw new BadRequestException('Falha ao atualizar usuário');
      }

      await this.forgetPasswordRepository.delete({ id: fp.id });
      await this.revokeAllSessionsForUser(user.id);

      return this.createSession(user);
    });
  }

  async checkTokenResetPassword(token: string) {
    return this.metrics.track('auth', 'check_token', async () => {
      const fp = await this.findValidForgetPassword(token);
      return !!fp;
    });
  }

  async refresh(refreshToken: string): Promise<SessionResponse> {
    return this.metrics.track('auth', 'refresh', async () => {
      const record = await this.refreshTokenRepository.findOne({
        where: { tokenHash: hashToken(refreshToken) },
        relations: ['user'],
      });

      if (!record || record.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      await this.refreshTokenRepository.delete({ id: record.id });
      return this.createSession(record.user);
    });
  }

  async findFirstUserByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  async findSessionByToken(token: string) {
    return this.sessionRepository.findOne({
      where: { token: hashToken(token) },
      select: {
        token: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        id: true,
        user: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      relations: ['user'],
      withDeleted: false,
    });
  }

  async authenticateAccessToken(raw: string): Promise<User> {
    try {
      this.checkToken(raw, {
        audience: JWTAudience.LOGIN,
        issuer: 'TaskHive',
      });
    } catch {
      throw new UnauthorizedException('Não autorizado');
    }

    const session = await this.findSessionByToken(raw);
    if (!session?.user) {
      throw new UnauthorizedException('Não autorizado');
    }

    return session.user;
  }

  async authenticatePersonalAccessToken(raw: string): Promise<User> {
    if (!raw.startsWith(PERSONAL_ACCESS_TOKEN_PREFIX)) {
      throw new UnauthorizedException('Não autorizado');
    }

    const record = await this.personalAccessTokenRepository.findOne({
      where: { tokenHash: hashToken(raw) },
      relations: ['user'],
    });

    if (!record || record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Não autorizado');
    }

    await this.personalAccessTokenRepository.update(
      { id: record.id },
      { lastUsedAt: new Date() },
    );

    return record.user;
  }

  async createSession(user: User): Promise<SessionResponse> {
    const accessToken = await this.createToken(user, JWTAudience.LOGIN);
    const refreshToken = generateRefreshToken();
    const refreshDays =
      this.configService.get<number>('jwtRefreshExpiresDays') ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    const session = await this.sessionRepository.save({
      user,
      token: hashToken(accessToken),
    });

    if (!session) {
      throw new BadRequestException('Não foi possível criar sessão');
    }

    await this.refreshTokenRepository.save({
      user,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    });

    user.password = undefined;

    return {
      token: accessToken,
      refreshToken,
      user,
    };
  }

  private async findValidForgetPassword(token: string) {
    try {
      this.checkToken(token, {
        audience: JWTAudience.FORGET_PASSWORD,
        issuer: 'TaskHive',
      });
    } catch {
      return null;
    }

    const fp = await this.forgetPasswordRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!fp || fp.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return fp;
  }

  private async revokeAllSessionsForUser(userId: string) {
    await this.sessionRepository.delete({ user: { id: userId } });
    await this.refreshTokenRepository.delete({ user: { id: userId } });
  }
}
