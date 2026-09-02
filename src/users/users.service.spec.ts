import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { mockDataSourceProvider, mockUserRepositoryProvider } from 'src/test-utils/unit-test.mocks';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        UsersService,
        mockUserRepositoryProvider,
        mockDataSourceProvider,
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
