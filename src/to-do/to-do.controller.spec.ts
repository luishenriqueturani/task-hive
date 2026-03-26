import { Test, TestingModule } from '@nestjs/testing';
import { ToDoController } from './to-do.controller';
import { ToDoService } from './to-do.service';
import { AuthGuard } from 'src/guards/auth.guard';

describe('ToDoController', () => {
  let controller: ToDoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToDoController],
      providers: [{ provide: ToDoService, useValue: {} }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ToDoController>(ToDoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
