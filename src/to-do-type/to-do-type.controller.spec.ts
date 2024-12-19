import { Test, TestingModule } from '@nestjs/testing';
import { ToDoTypeController } from './to-do-type.controller';
import { ToDoTypeService } from './to-do-type.service';

describe('ToDoTypeController', () => {
  let controller: ToDoTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToDoTypeController],
      providers: [ToDoTypeService],
    }).compile();

    controller = module.get<ToDoTypeController>(ToDoTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
