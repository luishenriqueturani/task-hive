import { Test, TestingModule } from '@nestjs/testing';
import { ToDoTypeService } from './to-do-type.service';

describe('ToDoTypeService', () => {
  let service: ToDoTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToDoTypeService],
    }).compile();

    service = module.get<ToDoTypeService>(ToDoTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
