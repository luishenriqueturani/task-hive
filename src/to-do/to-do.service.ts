import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateToDoDto } from './dto/create-to-do.dto';
import { UpdateToDoDto } from './dto/update-to-do.dto';
import { User } from 'src/users/entities/User.entity';
import { PostgreSQLTokens, RecurringTypes, ToDoStatus, ToDoTypes } from 'src/repository/postgresql.enums';
import { Repository } from 'typeorm';
import { SnowflakeIdService } from 'src/snowflakeid/snowflakeid.service';
import { ToDo } from './entities/ToDo.entity';
import { AppMetricsService } from 'src/metrics/app-metrics.service';

@Injectable()
export class ToDoService {

  private readonly logger = new Logger(ToDoService.name);

  constructor(
    @Inject(PostgreSQLTokens.TODO_REPOSITORY)
    private toDoRepository: Repository<ToDo>,

    private snowflakeIdService: SnowflakeIdService,
    private readonly metrics: AppMetricsService,
  ) { }

  async create(createToDoDto: CreateToDoDto, user: User) {
    return this.metrics.track('to-do', 'create', async () => {
      try {
        // Só true estrito: evita string/"false" truthy e default RECURRING na entidade.
        const isRecurring = createToDoDto.isRecurring === true;

        const created = await this.toDoRepository.save({
          id: String(this.snowflakeIdService.generateId()),
          title: createToDoDto.title,
          description: createToDoDto.description,
          user,
          status: ToDoStatus.CREATED,
          type: isRecurring ? ToDoTypes.RECURRING : ToDoTypes.PUNCTUAL,
          recurringDeadline: isRecurring
            ? createToDoDto.recurringDeadline ?? null
            : null,
          recurringTimes: isRecurring
            ? createToDoDto.recurringTimes ?? null
            : null,
          recurringType: isRecurring
            ? createToDoDto.recurringType ?? RecurringTypes.WEEKLY
            : null,
          recurringNextDate: isRecurring
            ? this.returnNextDate(
                createToDoDto.recurringType ?? RecurringTypes.WEEKLY,
              )
            : null,
          recurringCount: 0,
        });

        /**
         * disparar a notificação
         */

        return {
          ...created,
          id: created.id.toString(),
        }

      } catch (error) {
        this.logger.error('Falha ao criar tarefa avulsa', error);
        throw new BadRequestException('Não foi possível criar a tarefa');
      }
    });
  }

  async findAll(user: User) {
    return this.metrics.track('to-do', 'find_all', async () => {
      try {
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
            status: true,
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
        this.logger.error('Falha ao listar tarefas avulsas', error);
        throw new BadRequestException('Não foi possível listar as tarefas');
      }
    });
  }

  findOne(id: bigint, user: User) {
    return this.metrics.track('to-do', 'find_one', async () => {
      try {
        const todo = await this.toDoRepository.findOne({
          relations: ['user'],
          where: {
            id: String(id),
            user: { id: user.id },
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
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
        if (!todo) {
          throw new NotFoundException('Tarefa não encontrada');
        }
        return todo;
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('Falha ao buscar tarefa avulsa', error);
        throw new BadRequestException('Não foi possível buscar a tarefa');
      }
    });
  }

  private async findOwnedOrThrow(id: bigint, user: User) {
    const todo = await this.toDoRepository.findOne({
      where: {
        id: String(id),
        user: { id: user.id },
        deletedAt: null,
      },
    });
    if (!todo) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return todo;
  }

  async update(id: bigint, updateToDoDto: UpdateToDoDto, user: User) {
    return this.metrics.track('to-do', 'update', async () => {
      try {
        await this.findOwnedOrThrow(id, user);

        const patch: Record<string, unknown> = {
          ...(updateToDoDto.title !== undefined && { title: updateToDoDto.title }),
          ...(updateToDoDto.description !== undefined && {
            description: updateToDoDto.description,
          }),
        };

        if (updateToDoDto.isRecurring === true) {
          patch.type = ToDoTypes.RECURRING;
          if (updateToDoDto.recurringType !== undefined) {
            patch.recurringType = updateToDoDto.recurringType;
          }
          if (updateToDoDto.recurringDeadline !== undefined) {
            patch.recurringDeadline = updateToDoDto.recurringDeadline;
          }
          if (updateToDoDto.recurringTimes !== undefined) {
            patch.recurringTimes = updateToDoDto.recurringTimes;
          }
          const owned = await this.findOwnedOrThrow(id, user);
          if (!owned.recurringNextDate) {
            patch.recurringNextDate = this.returnNextDate(
              updateToDoDto.recurringType ??
                owned.recurringType ??
                RecurringTypes.WEEKLY,
            );
          }
        } else if (updateToDoDto.isRecurring === false) {
          patch.type = ToDoTypes.PUNCTUAL;
          patch.recurringType = null;
          patch.recurringDeadline = null;
          patch.recurringTimes = null;
          patch.recurringNextDate = null;
        } else {
          if (updateToDoDto.recurringDeadline !== undefined) {
            patch.recurringDeadline = updateToDoDto.recurringDeadline;
          }
          if (updateToDoDto.recurringTimes !== undefined) {
            patch.recurringTimes = updateToDoDto.recurringTimes;
          }
          if (updateToDoDto.recurringType !== undefined) {
            patch.recurringType = updateToDoDto.recurringType;
          }
        }

        return this.toDoRepository.update(id.toString(), patch);

      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('Falha ao atualizar tarefa avulsa', error);
        throw new BadRequestException('Não foi possível atualizar a tarefa');
      }
    });
  }

  async remove(id: bigint, user: User) {
    return this.metrics.track('to-do', 'remove', async () => {
      try {
        await this.findOwnedOrThrow(id, user);

        return this.toDoRepository.update(id.toString(), {
          deletedAt: new Date(),
        })

      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('Falha ao remover tarefa avulsa', error);
        throw new BadRequestException('Não foi possível remover a tarefa');
      }
    });
  }

  async endTask(id: bigint, user: User) {
    return this.metrics.track('to-do', 'end_task', async () => {
      try {
        await this.findOwnedOrThrow(id, user);

        const task = await this.toDoRepository.update(id.toString(), {
          status: ToDoStatus.DONE,
        })

        /**
         * disparar a notificação
         */

        return task

      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('Falha ao concluir tarefa avulsa', error);
        throw new BadRequestException('Não foi possível concluir a tarefa');
      }
    });
  }

  async changeTaskStatus(id: bigint, status: ToDoStatus, user: User) {
    return this.metrics.track('to-do', 'update_status', async () => {
      try {
        await this.findOwnedOrThrow(id, user);

        return this.toDoRepository.update(id.toString(), {
          status: status,
        })

      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('Falha ao alterar status da tarefa avulsa', error);
        throw new BadRequestException('Não foi possível alterar o status da tarefa');
      }
    });
  }

  returnNextDate(type: RecurringTypes, from: Date = new Date()) {
    const recurringNextDate = new Date(from);

    switch (type) {
      case RecurringTypes.DAILY:
        recurringNextDate.setDate(recurringNextDate.getDate() + 1);
        break;
      case RecurringTypes.WEEKLY:
        recurringNextDate.setDate(recurringNextDate.getDate() + 7);
        break;
      case RecurringTypes.MONTHLY:
        recurringNextDate.setMonth(recurringNextDate.getMonth() + 1);
        break;
      default:
        recurringNextDate.setDate(recurringNextDate.getDate() + 7);
        break;
    }

    return recurringNextDate;
  }

  async nextDateRecurringTask(id: bigint, user: User) {
    return this.metrics.track('to-do', 'next_recurring', async () => {
      try {
        const todo = await this.findOwnedOrThrow(id, user);

        if (todo.type !== ToDoTypes.RECURRING) {
          return this.endTaskUntracked(id, user);
        }

        const count = (todo.recurringCount ?? 0) + 1;

        if (todo.recurringTimes != null && count >= todo.recurringTimes) {
          return this.endTaskUntracked(id, user);
        }

        const base = todo.recurringNextDate
          ? new Date(todo.recurringNextDate)
          : new Date();
        const next = this.returnNextDate(
          todo.recurringType ?? RecurringTypes.WEEKLY,
          base,
        );

        if (
          todo.recurringDeadline &&
          next.getTime() > new Date(todo.recurringDeadline).getTime()
        ) {
          return this.endTaskUntracked(id, user);
        }

        return this.toDoRepository.update(id.toString(), {
          recurringNextDate: next,
          recurringCount: count,
          status: ToDoStatus.TODO,
        })

      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('Falha ao avançar recorrência da tarefa avulsa', error);
        throw new BadRequestException('Não foi possível avançar a recorrência da tarefa');
      }
    });
  }

  private async endTaskUntracked(id: bigint, user: User) {
    await this.findOwnedOrThrow(id, user);
    return this.toDoRepository.update(id.toString(), {
      status: ToDoStatus.DONE,
    })
  }
}
