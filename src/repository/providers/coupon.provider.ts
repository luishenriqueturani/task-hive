import { DataSource } from 'typeorm';
import { PostgreSQLTokens } from '../postgresql.enums';
import { Coupon } from '../../coupons/entities/Coupon.entity';
import { CouponRedemption } from '../../coupons/entities/CouponRedemption.entity';

export const couponProviders = [
  {
    provide: PostgreSQLTokens.COUPON_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Coupon),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
  {
    provide: PostgreSQLTokens.COUPON_REDEMPTION_REPOSITORY,
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(CouponRedemption),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  },
];
