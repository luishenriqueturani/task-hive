import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { ToDoService } from './to-do.service';
import { CreateToDoDto } from './dto/create-to-do.dto';
import { UpdateToDoDto } from './dto/update-to-do.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { ChangeTaskStatusDto } from './dto/changeTaskStatus.dto';


@UseGuards(AuthGuard)
@Controller('to-do')
export class ToDoController {
  constructor(private readonly toDoService: ToDoService) {}

  @Post()
  create(@Body() createToDoDto: CreateToDoDto, @User() user: UserEntity) {
    try {
      return this.toDoService.create(createToDoDto, user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get()
  findAll(@User() user: UserEntity) {
    try {
      return this.toDoService.findAll(user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.toDoService.findOne(BigInt(id));
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateToDoDto: UpdateToDoDto, @User() user: UserEntity) {
    try {
      return this.toDoService.update(BigInt(id), updateToDoDto, user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch(':id')
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.toDoService.remove(BigInt(id), user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch('end/:id')
  endTask(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.toDoService.endTask(BigInt(id), user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch('status/:id')
  changeTaskStatus(@Param('id') id: string, @Body() changeTaskStatusDto: ChangeTaskStatusDto, @User() user: UserEntity) {
    try {
      return this.toDoService.changeTaskStatus(BigInt(id), changeTaskStatusDto.status, user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch('nextDateRecurring/:id')
  nextDateRecurringTask(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.toDoService.nextDateRecurringTask(BigInt(id), user);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
