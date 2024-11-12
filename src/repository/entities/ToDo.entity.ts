import { BeforeInsert, Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ToDoCompleted } from "./ToDoCompleted.entity";
import { ToDoType } from "./ToDoType.entity";
import { ToDoStatus } from "../postgresql.enums";
import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { User } from "./User.entity";

@Entity()
export class ToDo {

  @PrimaryColumn('bigint')
  id: bigint;

  @Column('varchar')
  title: string;

  @Column({type: 'text', nullable: true})
  description: string;

  @Column({ type: "enum", enum: ToDoStatus, default: ToDoStatus.CREATED })
  status: ToDoStatus;

  @ManyToOne(() => ToDoType, (toDoType) => toDoType.toDo)
  type: ToDoType;

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


  constructor(
    private snowflakeIdService: SnowflakeIdService
  ) {}


  @BeforeInsert()
  async generateId() {
    this.id = this.snowflakeIdService.generateId();
  }

}

