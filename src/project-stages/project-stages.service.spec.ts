import { Test, TestingModule } from '@nestjs/testing';
import { ProjectStagesService } from './project-stages.service';

describe('ProjectStagesService', () => {
  let service: ProjectStagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectStagesService],
    }).compile();

    service = module.get<ProjectStagesService>(ProjectStagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
