import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { ToDoStatus } from "src/repository/postgresql.enums";

export class ChangeTaskStatusDto {

  @ApiProperty({
    description: 'Novo status: TODO, DONE, CANCELLED, PAUSED, CREATED',
    example: 'DONE',
    enum: ToDoStatus,
  })
  @IsEnum(ToDoStatus)
  status: ToDoStatus;
}