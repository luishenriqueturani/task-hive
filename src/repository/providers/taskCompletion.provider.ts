import { DataSource } from 'typeorm';
import { PostgreSQLTokens } from '../postgresql.enums';
import { TaskCompletion } from '../../tasks/entities/TaskCompletion.entity';

export const taskCompletionProviders = [
  {
    provide: PostgreSQLTokens.TASK_COMPLETION_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(TaskCompletion),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];
