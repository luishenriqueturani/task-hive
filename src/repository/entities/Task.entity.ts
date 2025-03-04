import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { TaskTimeTrak } from "./TaskTimeTrak.entity";
import { ProjectStage } from "./ProjectStage.entity";
import { User } from "./User.entity";
import { Subtask } from "./subtask.entity";

@Entity()
export class Task {

  @PrimaryColumn('bigint')
  id: string

  @Column({type: 'varchar', length: 255})
  name: string

  @Column({type: 'text', nullable: true})
  description: string

  @Column({type: 'timestamp', nullable: true})
  finishDate: Date

  @ManyToOne(() => User, user => user.tasks)
  user: User

  @OneToMany(() => TaskTimeTrak, timeTrack => timeTrack.task)
  timeTrack: TaskTimeTrak[]

  @OneToMany(() => Subtask, subtask => subtask.task)
  subtask: Subtask[]

  @ManyToOne(() => ProjectStage, stage => stage.tasks)
  stage: ProjectStage

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  constructor(
    private snowflakeIdService: SnowflakeIdService
  ) {}


  @BeforeInsert()
  async generateId() {
    this.id = String(this.snowflakeIdService.generateId());
  }

}
