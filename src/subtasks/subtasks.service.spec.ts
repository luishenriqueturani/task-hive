import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksService } from './subtasks.service';
import { TasksService } from 'src/tasks/tasks.service';
import {
  mockSnowflakeIdServiceProvider,
  mockSubtaskRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';

describe('SubtasksService', () => {
  let service: SubtasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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
