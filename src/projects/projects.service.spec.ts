import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { CompaniesService } from 'src/companies/companies.service';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { User } from 'src/users/entities/User.entity';
import {
  mockProjectRepositoryProvider,
  mockSnowflakeIdServiceProvider,
  mockUserRepositoryProvider,
} from 'src/test-utils/unit-test.mocks';
import { mockAppMetricsProvider } from 'src/test-utils/mock-app-metrics';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectsRepository: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        mockAppMetricsProvider,
        ProjectsService,
        mockProjectRepositoryProvider,
        mockUserRepositoryProvider,
        mockSnowflakeIdServiceProvider,
        { provide: CompaniesService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectsRepository = module.get(PostgreSQLTokens.PROJECT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lista all com dono ou participante', async () => {
    await service.findAll({ id: 'u1' } as User);
    const qb = projectsRepository.createQueryBuilder.mock.results[0]
      .value as {
      andWhere: jest.Mock;
      innerJoin: jest.Mock;
    };
    expect(qb.andWhere).toHaveBeenCalledWith(
      '(owner.id = :userId OR participants.id = :userId)',
      { userId: 'u1' },
    );
    expect(qb.innerJoin).not.toHaveBeenCalled();
  });

  it('lista owned só pelo dono', async () => {
    await service.findAll({ id: 'u1' } as User, 'owned');
    const qb = projectsRepository.createQueryBuilder.mock.results[0]
      .value as { andWhere: jest.Mock; innerJoin: jest.Mock };
    expect(qb.andWhere).toHaveBeenCalledWith('owner.id = :userId', {
      userId: 'u1',
    });
    expect(qb.innerJoin).not.toHaveBeenCalled();
  });

  it('lista invited com innerJoin no participante', async () => {
    await service.findAll({ id: 'u1' } as User, 'invited');
    const qb = projectsRepository.createQueryBuilder.mock.results[0]
      .value as { innerJoin: jest.Mock; andWhere: jest.Mock };
    expect(qb.innerJoin).toHaveBeenCalledWith(
      'project.participants',
      'member',
      'member.id = :userId',
      { userId: 'u1' },
    );
    expect(qb.andWhere).not.toHaveBeenCalled();
  });
});
