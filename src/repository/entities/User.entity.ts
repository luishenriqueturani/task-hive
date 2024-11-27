import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Project } from "./Project.entity";
import { TaskTimeTrak } from "./TaskTimeTrak.entity";
import { UserFriendship } from "./UserFriendship.entity";
import { ToDo } from "./ToDo.entity";
import { Session } from "./Session.entity";
import { ForgetPassword } from "./ForgetPassword.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
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
}
