import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/repository/entities/User.entity';

@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @User() user: UserEntity) {
    try {
      return this.tasksService.create(createTaskDto, user);
    } catch (error) {
      throw error;
    }
  }

  @Get()
  findAll(@User() user: UserEntity) {
    try {
      return this.tasksService.findAll(user);
    } catch (error) {
      throw error;
    }
  }

  @Get('stage/:stage')
  findByStage(@Param('stage') stage: string, @User() user: UserEntity) {
    try {
      return this.tasksService.findByStage(stage);
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.tasksService.findOne(BigInt(id));
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @User() user: UserEntity) {
    try {
      return this.tasksService.update(BigInt(id), updateTaskDto, user);
    } catch (error) {
      throw error;
    }
  }

  @Patch('nextStage/:id')
  toNextStage(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.tasksService.toNextStage(BigInt(id), user);
    } catch (error) {
      throw error;
    }
  }

  @Patch('previousStage/:id')
  toPreviousStage(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.tasksService.toPreviousStage(BigInt(id), user);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.tasksService.remove(BigInt(id), user);
    } catch (error) {
      throw error;
    }
  }
}
