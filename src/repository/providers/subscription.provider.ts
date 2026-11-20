import { DataSource } from 'typeorm';
import { Subscription } from '../../subscriptions/entities/Subscription.entity';
import { PostgreSQLTokens } from '../postgresql.enums';

export const subscriptionProviders = [
  {
    provide: PostgreSQLTokens.SUBSCRIPTION_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(Subscription),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];
