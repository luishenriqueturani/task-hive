import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { mockCompanyRepositoryProvider } from 'src/test-utils/unit-test.mocks';

describe('CompaniesService', () => {
  let service: CompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesService, mockCompanyRepositoryProvider],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
