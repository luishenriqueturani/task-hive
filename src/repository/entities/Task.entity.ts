import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { TaskTimeTrak } from "./TaskTimeTrak.entity";
import { ProjectStage } from "./ProjectStage.entity";

@Entity()
export class Task {

  @PrimaryColumn('bigint')
  id: bigint

  @Column({type: 'varchar', length: 255})
  name: string

  @Column('text')
  description: string

  @Column()
  finishDate: Date

  @OneToMany(() => TaskTimeTrak, timeTrack => timeTrack.task)
  timeTrack: TaskTimeTrak[]

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
    this.id = this.snowflakeIdService.generateId();
  }

}
