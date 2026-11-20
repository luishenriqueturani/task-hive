import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from 'src/companies/entities/Company.entity';
import { Coupon } from 'src/coupons/entities/Coupon.entity';
import { Plan } from 'src/plans/entities/Plan.entity';
import { User } from 'src/users/entities/User.entity';
import { SubscriptionStatus } from '../subscription.enums';

@Entity({ name: 'subscription' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  status: SubscriptionStatus;

  @ManyToOne(() => Plan, { nullable: false })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  /** Preenchido em contas PF. XOR com `company`. */
  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /** Preenchido em contas CNPJ. XOR com `user`. */
  @ManyToOne(() => Company, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company | null;

  @ManyToOne(() => Coupon, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon | null;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date | null;

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
