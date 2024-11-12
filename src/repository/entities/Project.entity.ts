import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User.entity";
import { Company } from "./Company.entity";
import { ProjectStage } from "./ProjectStage.entity";

@Entity()
export class Project {

  @PrimaryColumn('bigint')
  id: bigint

  @Column('varchar')
  name: string

  @Column('text')
  description: string


  @ManyToOne(() => User, (user) => user.projectsOwner)
  userOwner: User

  @ManyToOne(() => Company, (company) => company.projects)
  companyOwner: Company

  @ManyToMany(() => User)
  @JoinTable()
  participants: User[]

  @OneToMany(() => ProjectStage, stage => stage.project)
  stages: ProjectStage[]


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

