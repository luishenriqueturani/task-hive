import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanAudience, PlanInterval } from '../plan.enums';
import { PlanBenefit } from './PlanBenefit.entity';

@Entity({ name: 'plan' })
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', length: 64 })
  slug: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 32, default: PlanAudience.BOTH })
  accountKind: PlanAudience;

  @Column({ type: 'varchar', length: 32, default: PlanInterval.MONTHLY })
  interval: PlanInterval;

  @Column({ type: 'int', default: 0 })
  priceCents: number;

  @Column({ type: 'varchar', length: 8, default: 'BRL' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', default: 0 })
  maxProjects: number;

  @Column({ type: 'int', default: 0 })
  maxApiKeys: number;

  @Column({ type: 'int', default: 0 })
  maxStandaloneTasks: number;

  @Column({ type: 'int', default: 0 })
  maxProjectGuests: number;

  @OneToMany(() => PlanBenefit, (benefit) => benefit.plan, { cascade: true })
  benefits: PlanBenefit[];

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
