import { DataSource } from 'typeorm';
import { SupportMessage } from '../../support/entities/SupportMessage.entity';
import { SupportTicket } from '../../support/entities/SupportTicket.entity';
import { PostgreSQLTokens } from '../postgresql.enums';

export const supportProviders = [
  {
    provide: PostgreSQLTokens.SUPPORT_TICKET_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SupportTicket),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
  {
    provide: PostgreSQLTokens.SUPPORT_MESSAGE_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(SupportMessage),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];
