import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DatabaseModule } from 'src/repository/database.module';
import { planProviders } from 'src/repository/providers/plan.provider';
import { AdminPlansController } from './admin-plans.controller';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PlansController, AdminPlansController],
  providers: [...planProviders, PlansService],
  exports: [PlansService],
})
export class PlansModule {}
