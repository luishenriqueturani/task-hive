import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStagesController } from './project-stages.controller';
import { ProjectStagesService } from './project-stages.service';

describe('ProjectStagesController', () => {
  let controller: ProjectStagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectStagesController],
      providers: [ProjectStagesService],
    }).compile();

    controller = module.get<ProjectStagesController>(ProjectStagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
