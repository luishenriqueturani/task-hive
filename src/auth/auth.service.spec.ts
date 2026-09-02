import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JWTAudience } from './auth.enums';
import { AccountKind } from 'src/users/account-kind.enum';
import { User } from 'src/users/entities/User.entity';
import {
  mockConfigServiceProvider,
  mockForgetPasswordRepositoryProvider,
  mockJwtServiceProvider,
  mockPersonalAccessTokenRepositoryProvider,
  mockRefreshTokenRepositoryProvider,
  mockSessionRepositoryProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        AuthService,
        mockJwtServiceProvider,
        mockUserRepositoryProvider,
        mockForgetPasswordRepositoryProvider,
        mockSessionRepositoryProvider,
        mockRefreshTokenRepositoryProvider,
        mockPersonalAccessTokenRepositoryProvider,
        mockConfigServiceProvider,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('inclui accountKind no JWT de acesso', async () => {
    await service.createToken(
      {
        id: 'u1',
        name: 'Ana',
        email: 'ana@example.com',
        role: 'CLIENT',
        accountKind: AccountKind.COMPANY,
      } as User,
      JWTAudience.LOGIN,
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'u1',
        email: 'ana@example.com',
        accountKind: AccountKind.COMPANY,
      }),
      expect.objectContaining({ audience: JWTAudience.LOGIN }),
    );
  });
});
