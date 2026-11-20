import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { CouponsModule } from 'src/coupons/coupons.module';
import { DatabaseModule } from 'src/repository/database.module';
import { companyProvider } from 'src/repository/providers/company.provider';
import { planProviders } from 'src/repository/providers/plan.provider';
import { subscriptionProviders } from 'src/repository/providers/subscription.provider';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [DatabaseModule, AuthModule, CouponsModule],
  controllers: [AdminSubscriptionsController],
  providers: [
    ...subscriptionProviders,
    ...planProviders,
    ...companyProvider,
    SubscriptionsService,
  ],
  exports: [SubscriptionsService, ...subscriptionProviders],
})
export class SubscriptionsModule {}
