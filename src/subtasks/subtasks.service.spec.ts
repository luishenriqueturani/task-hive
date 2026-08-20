import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksService } from './subtasks.service';
import { TasksService } from 'src/tasks/tasks.service';
import {
  mockSnowflakeIdServiceProvider,
  mockSubtaskRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';

describe('SubtasksService', () => {
  let service: SubtasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        SubtasksService,
        mockSubtaskRepositoryProvider,
        mockSnowflakeIdServiceProvider,
        { provide: TasksService, useValue: {} },
      ],
    }).compile();

    service = module.get<SubtasksService>(SubtasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
