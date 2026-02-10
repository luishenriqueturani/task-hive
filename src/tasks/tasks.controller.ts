import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { TimetrackService } from './timetrack.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTimetrackDto } from './dto/create-timetrack.dto';
import { UpdateTimetrackDto } from './dto/update-timetrack.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly timetrackService: TimetrackService,
  ) {}

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

  @Get(':taskId/timetrack')
  listTimetrack(@Param('taskId') taskId: string, @User() user: UserEntity) {
    return this.timetrackService.list(BigInt(taskId), user);
  }

  @Post(':taskId/timetrack/start')
  startTimetrack(
    @Param('taskId') taskId: string,
    @Body() dto: CreateTimetrackDto,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.start(BigInt(taskId), user, dto);
  }

  @Patch(':taskId/timetrack/:id/stop')
  stopTimetrack(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.stop(BigInt(taskId), id, user);
  }

  @Patch(':taskId/timetrack/:id')
  updateTimetrack(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTimetrackDto,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.update(BigInt(taskId), id, user, dto);
  }

  @Delete(':taskId/timetrack/:id')
  removeTimetrack(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @User() user: UserEntity,
  ) {
    return this.timetrackService.remove(BigInt(taskId), id, user);
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
