import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
