import { BadRequestException, Inject, Injectable, Post } from '@nestjs/common';
import { CreateToDoTypeDto } from './dto/create-to-do-type.dto';
import { UpdateToDoTypeDto } from './dto/update-to-do-type.dto';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Repository } from 'typeorm';
import { ToDoType } from 'src/repository/entities/ToDoType.entity';

@Injectable()
export class ToDoTypeService {

  constructor(
    @Inject(PostgreSQLTokens.TODO_TYPE_REPOSITORY)
    private toDoTypeRepository: Repository<ToDoType>
  ) { }

  create(createToDoTypeDto: CreateToDoTypeDto) {
    try {
      return this.toDoTypeRepository.save(createToDoTypeDto)
    } catch (error) {
      throw new Error('Falha ao criar o tipo de tarefa, Error: ' + error)
    }
  }

  findAll() {
    try {
      return this.toDoTypeRepository.find()
    } catch (error) {
      throw new Error('Falha ao buscar o tipo de tarefa, Error: ' + error)
    }
  }

  findOne(id: string) {
    try {
      
      return this.toDoTypeRepository.findOne({
        where: {
          id,
        },
      })
    } catch (error) {
      throw new BadRequestException('Nehum tipo de tarefa encontrado, Error: ' + error)
    }
  }

  update(id: string, updateToDoTypeDto: UpdateToDoTypeDto) {
    try {
      return this.toDoTypeRepository.update(id, updateToDoTypeDto)
    } catch (error) {
      throw new Error('Falha ao buscar o tipo de tarefa, Error: ' + error)
    }
  }

  remove(id: string) {
    try {
      return this.toDoTypeRepository.update(id, {
        deletedAt: new Date(),
      })
    } catch (error) {
      throw new Error('Falha ao buscar o tipo de tarefa, Error: ' + error)
    }
  }
}
