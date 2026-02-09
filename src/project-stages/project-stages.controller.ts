import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectStagesService } from './project-stages.service';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserEntity } from 'src/users/entities/User.entity';

@ApiTags('project-stages')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('project-stages')
export class ProjectStagesController {
  constructor(private readonly projectStagesService: ProjectStagesService) {}

  @Post()
  create(@Body() createProjectStageDto: CreateProjectStageDto, @User() user: UserEntity) {
    try {
      return this.projectStagesService.create(createProjectStageDto, user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Get()
  findAll() {
    try {
      return this.projectStagesService.findAll();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  
  @Get('project/:id')
  findAllByProject(@Param('id') id: string) {
    try {
      return this.projectStagesService.findAllByProject(id);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.projectStagesService.findOne(BigInt(id));
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectStageDto: UpdateProjectStageDto, @User() user: UserEntity) {
    try {
      return this.projectStagesService.update(BigInt(id), updateProjectStageDto, user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: UserEntity) {
    try {
      return this.projectStagesService.remove(BigInt(id), user);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
