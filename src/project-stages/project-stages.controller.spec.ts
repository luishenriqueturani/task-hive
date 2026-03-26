import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStagesController } from './project-stages.controller';
import { ProjectStagesService } from './project-stages.service';
import { AuthGuard } from 'src/guards/auth.guard';

describe('ProjectStagesController', () => {
  let controller: ProjectStagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectStagesController],
      providers: [{ provide: ProjectStagesService, useValue: {} }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProjectStagesController>(ProjectStagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
