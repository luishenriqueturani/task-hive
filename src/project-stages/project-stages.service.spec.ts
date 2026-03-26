import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStagesService } from './project-stages.service';
import { ProjectsService } from 'src/projects/projects.service';
import {
  mockProjectStageRepositoryProvider,
  mockSnowflakeIdServiceProvider,
} from 'src/test-utils/unit-test.mocks';

describe('ProjectStagesService', () => {
  let service: ProjectStagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectStagesService,
        mockProjectStageRepositoryProvider,
        mockSnowflakeIdServiceProvider,
        { provide: ProjectsService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProjectStagesService>(ProjectStagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
