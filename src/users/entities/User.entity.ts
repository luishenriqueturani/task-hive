import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Project } from "../../projects/entities/Project.entity";
import { Task } from "../../tasks/entities/Task.entity";
import { Subtask } from "../../subtasks/entities/subtask.entity";
import { ToDo } from "src/to-do/entities/ToDo.entity";
import { TaskTimeTrak } from "src/tasks/entities/TaskTimeTrak.entity";
import { UserFriendship } from "./UserFriendship.entity";
import { Session } from "src/auth/entities/Session.entity";
import { ForgetPassword } from "src/auth/entities/ForgetPassword.entity";

@Entity()
export class User {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  name: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({type: 'varchar', length: 255})
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Project, (project) => project.userOwner)
  projectsOwner: Project[];


  @OneToMany(() => ToDo, toDo => toDo.user)
  toDoTaks: ToDo[]

  @OneToMany(() => TaskTimeTrak, taskTimeTrak => taskTimeTrak.user)
  taskTimeTrack: TaskTimeTrak

  @OneToMany(() => UserFriendship, friendship => friendship.user1)
  friendship1: UserFriendship

  @OneToMany(() => UserFriendship, friendship => friendship.user2)
  friendship2: UserFriendship

  @OneToMany(() => Session, session => session.user)
  session: Session[]

  @OneToMany(() => ForgetPassword, forgetPassword => forgetPassword.user)
  forgetPassword: ForgetPassword

  @OneToMany(() => Task, task => task.user)
  tasks: Task[]

  @OneToMany(() => Subtask, subtask => subtask.responsible)
  subtask: Subtask[]
}
