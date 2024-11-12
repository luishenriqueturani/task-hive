import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ToDo } from "./ToDo.entity";


@Entity()
export class ToDoCompleted {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => ToDo, (toDo) => toDo.completed)
  toDo: ToDo;
  
  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;
}
