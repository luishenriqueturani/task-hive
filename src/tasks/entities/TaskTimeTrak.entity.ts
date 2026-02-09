import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Task } from "../../tasks/entities/Task.entity"
import { User } from "src/users/entities/User.entity"

@Entity()
export class TaskTimeTrak {
  @PrimaryColumn('bigint')
  id: string

  @ManyToOne(() => Task, task => task.timeTrack)
  task: Task

  @ManyToOne(() => User, user => user.taskTimeTrack)
  user: User

  @Column()
  start: Date
  
  @Column({nullable: true})
  end: Date
}
