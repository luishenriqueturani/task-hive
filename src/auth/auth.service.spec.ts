import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  mockConfigServiceProvider,
  mockForgetPasswordRepositoryProvider,
  mockJwtServiceProvider,
  mockSessionRepositoryProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        mockJwtServiceProvider,
        mockUserRepositoryProvider,
        mockForgetPasswordRepositoryProvider,
        mockSessionRepositoryProvider,
        mockConfigServiceProvider,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
