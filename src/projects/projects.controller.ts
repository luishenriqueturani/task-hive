import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';
import { AuthGuard } from 'src/guards/auth.guard';

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
      return this.projectsService.findAll();
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
      return this.projectsService.update(BigInt(id), updateProjectDto);
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectsService.remove(BigInt(id));
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
