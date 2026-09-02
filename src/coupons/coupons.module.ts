import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DatabaseModule } from 'src/repository/database.module';
import { couponProviders } from 'src/repository/providers/coupon.provider';
import { planProviders } from 'src/repository/providers/plan.provider';
import { AdminCouponsController } from './admin-coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AdminCouponsController],
  providers: [...couponProviders, ...planProviders, CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
