import { Test, TestingModule } from '@nestjs/testing';
import { ToDoService } from './to-do.service';
import {
  mockSnowflakeIdServiceProvider,
  mockTodoRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';

describe('ToDoService', () => {
  let service: ToDoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        ToDoService,
        mockTodoRepositoryProvider,
        mockSnowflakeIdServiceProvider,
      ],
    }).compile();

    service = module.get<ToDoService>(ToDoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
