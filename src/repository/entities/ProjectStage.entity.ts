import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./Project.entity";
import { Task } from "./Task.entity";

@Entity()
export class ProjectStage {

  @PrimaryColumn('bigint')
  id: bigint

  @Column('varchar')
  name: string

  @ManyToOne(() => Project, project => project.stages)
  project: Project

  @OneToMany(() => Task, task => task.stage)
  tasks: Task[]

  @OneToOne(() => ProjectStage)
  nextStage: ProjectStage

  @OneToOne(() => ProjectStage)
  prevStage: ProjectStage

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

