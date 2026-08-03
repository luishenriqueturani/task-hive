import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ProjectStage } from 'src/project-stages/entities/ProjectStage.entity';
import { Task } from './Task.entity';

@Entity()
export class TaskCompletion {
  @PrimaryColumn('bigint')
  id: string;

  @ManyToOne(() => Task, (task) => task.completions)
  task: Task;

  @ManyToOne(() => ProjectStage)
  stage: ProjectStage;

  @Column({ type: 'timestamp' })
  completedAt: Date;
}
