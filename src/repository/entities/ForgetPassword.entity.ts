import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity";

@Entity()
export class ForgetPassword {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, user => user.toDoTaks)
  user: User

  @Column()
  token: string;

  @Column()
  expiresAt: Date;
}

