import { DataSource } from 'typeorm';
import { PostgreSQLTokens } from '../postgresql.enums';
import { ProjectInvite } from '../../projects/entities/ProjectInvite.entity';

export const projectInviteProviders = [
  {
    provide: PostgreSQLTokens.PROJECT_INVITE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ProjectInvite),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];
