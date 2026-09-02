import { User } from 'src/users/entities/User.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from './Project.entity';
import { ProjectInviteStatus } from '../project-invite-status.enum';

@Entity()
export class ProjectInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  /** Segredo da URL `/invite/:token` (também na listagem do gestor, para copiar). */
  @Column({ type: 'varchar', length: 128, unique: true })
  token: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  invitedBy: User;

  @Column({
    type: 'varchar',
    length: 32,
    default: ProjectInviteStatus.PENDING,
  })
  status: ProjectInviteStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  acceptedBy: User | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP()' })
  createdAt: Date;
}
