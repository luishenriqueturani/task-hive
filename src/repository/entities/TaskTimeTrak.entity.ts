import { BeforeInsert, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Task } from "./Task.entity"
import { User } from "./User.entity"
import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service"

@Entity()
export class TaskTimeTrak {
  @PrimaryColumn('bigint')
  id: bigint

  @ManyToOne(() => Task, task => task.timeTrack)
  task: Task

  @ManyToOne(() => User, user => user.taskTimeTrack)
  user: User

  @Column()
  start: Date
  
  @Column({nullable: true})
  end: Date


  constructor(
    private snowflakeIdService: SnowflakeIdService
  ) {}


  @BeforeInsert()
  async generateId() {
    this.id = this.snowflakeIdService.generateId();
  }
}
