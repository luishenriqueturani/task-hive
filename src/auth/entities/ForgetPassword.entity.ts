import { User } from "src/users/entities/User.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

