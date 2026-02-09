import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { RecurringTypes, ToDoStatus, ToDoTypes } from "src/repository/postgresql.enums";
import { User } from "src/users/entities/User.entity";
import { ToDoCompleted } from "./ToDoCompleted.entity";

@Entity()
export class ToDo {

  @PrimaryColumn('bigint')
  id: string;

  @Column({type: 'varchar', length: 255})
  title: string;

  @Column({type: 'text', nullable: true})
  description: string;

  @Column({ type: "enum", enum: ToDoStatus, default: ToDoStatus.CREATED })
  status: ToDoStatus;
  
  @Column({ type: "enum", enum: ToDoTypes, default: ToDoTypes.RECURRING })
  type: ToDoTypes;

  @Column({ type: "enum", enum: RecurringTypes, nullable: true, default: RecurringTypes.MONTHLY })
  recurringType: RecurringTypes;

  @Column({ type: "int", nullable: true })
  recurringTimes: number;
  
  @Column({ type: "int", nullable: true, default: 0 })
  recurringCount: number;

  @Column({ type: "timestamp", nullable: true })
  recurringNextDate: Date;

  @Column({ type: "timestamp", nullable: true })
  recurringDeadline: Date;

  @ManyToOne(() => User, user => user.toDoTaks)
  user: User

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => ToDoCompleted, (toDoCompleted) => toDoCompleted.toDo)
  completed: ToDoCompleted[];
}

