import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from '../../plans/entities/Plan.entity';
import { CouponType } from '../coupon.enums';
import { CouponRedemption } from './CouponRedemption.entity';

@Entity({ name: 'coupon' })
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 32 })
  type: CouponType;

  @Column({ type: 'int' })
  value: number;

  @Column({ type: 'int', nullable: true })
  maxRedemptions: number | null;

  @Column({ type: 'int', default: 0 })
  redeemedCount: number;

  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => Plan)
  @JoinTable({
    name: 'coupon_applicable_plan',
    joinColumn: { name: 'couponId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'planId', referencedColumnName: 'id' },
  })
  applicablePlans: Plan[];

  @OneToMany(() => CouponRedemption, (redemption) => redemption.coupon)
  redemptions: CouponRedemption[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP()' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    onUpdate: 'CURRENT_TIMESTAMP()',
    nullable: true,
  })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
