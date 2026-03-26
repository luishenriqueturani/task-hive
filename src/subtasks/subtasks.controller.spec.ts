import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksController } from './subtasks.controller';
import { SubtasksService } from './subtasks.service';
import { AuthGuard } from 'src/guards/auth.guard';

describe('SubtasksController', () => {
  let controller: SubtasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubtasksController],
      providers: [{ provide: SubtasksService, useValue: {} }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SubtasksController>(SubtasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
