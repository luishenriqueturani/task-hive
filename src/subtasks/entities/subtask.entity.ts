import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm"
import { Task } from "../../tasks/entities/Task.entity"
import { User } from "../../users/entities/User.entity"

@Entity()
export class Subtask {
  @PrimaryColumn('bigint')
  id: string

  @Column({ type: 'varchar', length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string

  @ManyToOne(() => Task, task => task.subtask)
  task: Task

  @ManyToOne(() => User, user => user.subtask)
  responsible: User

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

}
