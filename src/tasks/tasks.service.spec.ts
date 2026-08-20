import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { ProjectStagesService } from 'src/project-stages/project-stages.service';
import { ProjectsService } from 'src/projects/projects.service';
import {
  mockSnowflakeIdServiceProvider,
  mockTaskCompletionRepositoryProvider,
  mockTaskRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        TasksService,
        mockTaskRepositoryProvider,
        mockTaskCompletionRepositoryProvider,
        mockSnowflakeIdServiceProvider,
        { provide: ProjectStagesService, useValue: {} },
        { provide: ProjectsService, useValue: {} },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
