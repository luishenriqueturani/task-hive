import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ToDoStatus } from "src/repository/postgresql.enums";

export class ChangeTaskStatusDto {

  @ApiProperty()
  @IsEnum(ToDoStatus)
  status: ToDoStatus
}