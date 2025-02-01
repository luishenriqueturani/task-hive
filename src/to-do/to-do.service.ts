import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateToDoDto } from './dto/create-to-do.dto';
import { UpdateToDoDto } from './dto/update-to-do.dto';
import { User } from 'src/repository/entities/User.entity';
import { PostgreSQLTokens, RecurringTypes, ToDoStatus, ToDoTypes } from 'src/repository/postgresql.enums';
import { ToDo } from 'src/repository/entities/ToDo.entity';
import { Repository } from 'typeorm';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';

@Injectable()
export class ToDoService {

  constructor(
    @Inject(PostgreSQLTokens.TODO_REPOSITORY)
    private toDoRepository: Repository<ToDo>,

    private snowflakeIdService: SnowflakeIdService,
  ) { }

  async create(createToDoDto: CreateToDoDto, user: User) {
    try {

      const recurringNextDate = new Date();

      switch (createToDoDto.recurringType) {
        case RecurringTypes.DAILY:
          recurringNextDate.setDate(recurringNextDate.getDate() + 1);
          break;
        case RecurringTypes.WEEKLY:
          recurringNextDate.setDate(recurringNextDate.getDate() + 7);
          break;
        case RecurringTypes.MONTHLY:
          recurringNextDate.setMonth(recurringNextDate.getMonth() + 1);
          break;
      }

      const created = await this.toDoRepository.save({
        id: this.snowflakeIdService.generateId(),
        title: createToDoDto.title,
        description: createToDoDto.description,
        user,
        status: ToDoStatus.CREATED,
        type: createToDoDto.isRecurring ? ToDoTypes.RECURRING : ToDoTypes.PUNCTUAL,
        recurringDeadline: createToDoDto.recurringDeadline,
        recurringTimes: createToDoDto.recurringTimes,
        recurringType: createToDoDto.recurringType,
        recurringNextDate: recurringNextDate,
      })

      console.log(created)

      return {
        ...created,
        id: created.id.toString(),
      }

    } catch (error) {
      throw new BadRequestException('Falha ao criar a tarefa, Error: ' + error)
    }
  }

  async findAll(user: User) {
    try {
      //console.log(user)
      return await this.toDoRepository.find({
        relations: ['user'],
        where: {
          user: {
            id: user.id,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          recurringDeadline: true,
          recurringTimes: true,
          recurringType: true,
          recurringCount: true,
          recurringNextDate: true,
          type: true,
          user: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
          createdAt: true,
          updatedAt: true,
        }
      })
    } catch (error) {
      throw new BadRequestException('Falha ao buscar todas as tarefas, Error: ' + error)
    }
  }

  findOne(id: bigint) {
    try {
      return this.toDoRepository.findOne({
        relations: ['user'],
        where: {
          id: id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          recurringDeadline: true,
          recurringTimes: true,
          recurringType: true,
          recurringCount: true,
          recurringNextDate: true,
          type: true,
          user: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
          createdAt: true,
          updatedAt: true,
        }
      })
    } catch (error) {
      throw new BadRequestException('Falha ao buscar a tarefa, Error: ' + error)
    }
  }

  async update(id: bigint, updateToDoDto: UpdateToDoDto, user: User) {
    try {
      const todo = await this.toDoRepository.find({
        where: {
          id: id,
          user,
        },
      })

      if (!todo) {
        throw new BadRequestException('Tarefa não encontrada')
      }

      return this.toDoRepository.update(id.toString(), {
        title: updateToDoDto.title,
        description: updateToDoDto.description,
      })

    } catch (error) {
      throw new BadRequestException('Falha ao atualizar a tarefa, Error: ' + error)
    }
  }

  async remove(id: bigint, user: User) {
    try {
      const todo = await this.toDoRepository.find({
        where: {
          id: id,
          user,
        },
      })

      if (!todo) {
        throw new BadRequestException('Tarefa não encontrada')
      }

      return this.toDoRepository.update(id.toString(), {
        deletedAt: new Date(),
      })

    } catch (error) {
      throw new BadRequestException('Falha ao remover a tarefa, Error: ' + error)
    }
  }
}
