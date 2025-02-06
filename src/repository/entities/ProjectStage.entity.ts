import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./Project.entity";
import { Task } from "./Task.entity";

@Entity()
export class ProjectStage {

  @PrimaryColumn('bigint')
  id: bigint

  @Column({type: 'varchar', length: 255})
  name: string

  @ManyToOne(() => Project, project => project.stages)
  project: Project

  @OneToMany(() => Task, task => task.stage)
  tasks: Task[]

  @OneToOne(() => ProjectStage)
  @JoinColumn()
  nextStage: ProjectStage
  
  @OneToOne(() => ProjectStage)
  @JoinColumn()
  prevStage: ProjectStage

  @Column({ type: "int", default: 0 })
  order: number

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

