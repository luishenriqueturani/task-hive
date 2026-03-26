import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { CompaniesService } from 'src/companies/companies.service';
import {
  mockProjectRepositoryProvider,
  mockSnowflakeIdServiceProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        mockProjectRepositoryProvider,
        mockUserRepositoryProvider,
        mockSnowflakeIdServiceProvider,
        { provide: CompaniesService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
