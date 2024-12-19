import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject, Put } from '@nestjs/common';
import { ToDoTypeService } from './to-do-type.service';
import { CreateToDoTypeDto } from './dto/create-to-do-type.dto';
import { UpdateToDoTypeDto } from './dto/update-to-do-type.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';


@UseGuards(AuthGuard)
@Controller('to-do-type')
export class ToDoTypeController {
  constructor(
    private readonly toDoTypeService: ToDoTypeService,
  ) { }

  @Post()
  create(@Body() createToDoTypeDto: CreateToDoTypeDto) {
    try {
      return this.toDoTypeService.create(createToDoTypeDto);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get()
  findAll() {
    try {
      return this.toDoTypeService.findAll()
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {

      return this.toDoTypeService.findOne(id);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateToDoTypeDto: UpdateToDoTypeDto) {
    try {
      return this.toDoTypeService.update(id, updateToDoTypeDto);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch(':id')
  remove(@Param('id') id: string) {
    try {
      return this.toDoTypeService.remove(id);
      
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
