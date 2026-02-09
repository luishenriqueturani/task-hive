import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { AuthGuard } from 'src/guards/auth.guard';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @User() user: UserEntity) {
    try {
      
      return this.projectsService.create(createProjectDto, user);
  
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get()
  findAll(@User() user: UserEntity) {
    try {
      return this.projectsService.findAll(user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id/participants')
  listParticipants(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.listParticipants(BigInt(id), user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Post(':id/participants')
  addParticipant(@Param('id') id: string, @Body() dto: AddParticipantDto, @User() user: UserEntity) {
    try {
      return this.projectsService.addParticipant(BigInt(id), dto.userId, user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Delete(':id/participants/:userId')
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string, @User() user: UserEntity) {
    try {
      return this.projectsService.removeParticipant(BigInt(id), userId, user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.findOne(BigInt(id));
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @User() user: UserEntity) {
    try {
      return this.projectsService.update(BigInt(id), updateProjectDto, user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.remove(BigInt(id), user);
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
