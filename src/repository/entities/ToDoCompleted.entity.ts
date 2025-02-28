import { CreateDateColumn, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { ToDo } from "./ToDo.entity";


@Entity()
export class ToDoCompleted {
  @PrimaryColumn('bigint')
  id: string;

  @ManyToOne(() => ToDo, (toDo) => toDo.completed)
  toDo: ToDo;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;
}
