import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
        throw new BadRequestException('Falha ao criar a tarefa, Error: ' + error)
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
        throw new BadRequestException('Falha ao buscar todas as tarefas, Error: ' + error)
      }
    });
  }

  findOne(id: bigint) {
    return this.metrics.track('to-do', 'find_one', () => {
      try {
        return this.toDoRepository.findOne({
          relations: ['user'],
          where: {
            id: String(id),
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
        throw new BadRequestException('Falha ao buscar a tarefa, Error: ' + error)
      }
    });
  }

  async update(id: bigint, updateToDoDto: UpdateToDoDto, user: User) {
    return this.metrics.track('to-do', 'update', async () => {
      try {
        const todo = await this.toDoRepository.findOne({
          where: {
            id: String(id),
          },
        })

        if (!todo) {
          throw new BadRequestException('Tarefa não encontrada')
        }

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
          if (!todo.recurringNextDate) {
            patch.recurringNextDate = this.returnNextDate(
              updateToDoDto.recurringType ??
                todo.recurringType ??
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
        throw new BadRequestException('Falha ao atualizar a tarefa, Error: ' + error)
      }
    });
  }

  async remove(id: bigint, user: User) {
    return this.metrics.track('to-do', 'remove', async () => {
      try {
        const todo = await this.toDoRepository.findOne({
          where: {
            id: String(id),
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
    });
  }

  async endTask(id: bigint, user: User) {
    return this.metrics.track('to-do', 'end_task', async () => {
      try {
        const todo = await this.toDoRepository.findOne({
          where: {
            id: String(id),
          },
        })

        if (!todo) {
          throw new BadRequestException('Tarefa não encontrada')
        }

        const task = await this.toDoRepository.update(id.toString(), {
          status: ToDoStatus.DONE,
        })

        /**
         * disparar a notificação
         */

        return task

      } catch (error) {
        throw new BadRequestException('Falha ao remover a tarefa, Error: ' + error)
      }
    });
  }

  async changeTaskStatus(id: bigint, status: ToDoStatus, user: User) {
    return this.metrics.track('to-do', 'update_status', async () => {
      try {
        const todo = await this.toDoRepository.findOne({
          where: {
            id: String(id),
          },
        })

        if (!todo) {
          throw new BadRequestException('Tarefa não encontrada')
        }

        return this.toDoRepository.update(id.toString(), {
          status: status,
        })

      } catch (error) {
        throw new BadRequestException('Falha ao remover a tarefa, Error: ' + error)
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
        const todo = await this.toDoRepository.findOne({
          where: {
            id: String(id),
          },
        })

        if (!todo) {
          throw new BadRequestException('Tarefa não encontrada')
        }

        if (todo.type !== ToDoTypes.RECURRING) {
          return this.endTaskUntracked(id);
        }

        const count = (todo.recurringCount ?? 0) + 1;

        if (todo.recurringTimes != null && count >= todo.recurringTimes) {
          return this.endTaskUntracked(id);
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
          return this.endTaskUntracked(id);
        }

        return this.toDoRepository.update(id.toString(), {
          recurringNextDate: next,
          recurringCount: count,
          status: ToDoStatus.TODO,
        })

      } catch (error) {
        throw new BadRequestException('Falha ao remover a tarefa, Error: ' + error)
      }
    });
  }

  private async endTaskUntracked(id: bigint) {
    const todo = await this.toDoRepository.findOne({
      where: { id: String(id) },
    })
    if (!todo) {
      throw new BadRequestException('Tarefa não encontrada')
    }
    return this.toDoRepository.update(id.toString(), {
      status: ToDoStatus.DONE,
    })
  }
}
