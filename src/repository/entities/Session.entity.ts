import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User.entity";


@Entity()
export class Session {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, user => user.toDoTaks)
  user: User

  @Column()
  token: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

}

