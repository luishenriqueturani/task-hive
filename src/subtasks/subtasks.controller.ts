import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/repository/entities/User.entity';

@UseGuards(AuthGuard)
@Controller('subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  create(@Body() createSubtaskDto: CreateSubtaskDto, @User() user: UserEntity) {
    try {
      return this.subtasksService.create(createSubtaskDto, user);
    } catch (error) {
      throw error
    }
  }

  @Get()
  findAll() {
    try {
      return this.subtasksService.findAll();
    } catch (error) {
      throw error
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.subtasksService.findOne(id);
    } catch (error) {
      throw error
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubtaskDto: UpdateSubtaskDto, @User() user: UserEntity) {
    try {
      return this.subtasksService.update(id, updateSubtaskDto, user);
    } catch (error) {
      throw error
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.subtasksService.remove(id, user);
    } catch (error) {
      throw error
    }
  }
}
