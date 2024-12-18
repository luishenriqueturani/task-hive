import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    try {
      return this.usersService.create(createUserDto);
    } catch (error) {
      return error
    }
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    try {
      return this.usersService.findAll();
    } catch (error) {
      return error
    }
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.usersService.findOne(id);
    } catch (error) {
      return error
    }
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return this.usersService.update(id, updateUserDto);
    } catch (error) {
      return error
    }
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  softDelete(@Param('id') id: string) {
    try {
      return this.usersService.softDelete(id);
    } catch (error) {
      return error
    }
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.usersService.remove(id);
    } catch (error) {
      return error
    }
  }


}
    
