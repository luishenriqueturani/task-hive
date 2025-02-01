import { IsEnum } from "class-validator";
import { ToDoStatus } from "src/repository/postgresql.enums";

export class ChangeTaskStatusDto {

  @IsEnum(ToDoStatus)
  status: ToDoStatus
}