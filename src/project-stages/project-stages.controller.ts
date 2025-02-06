import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectStagesService } from './project-stages.service';
import { CreateProjectStageDto } from './dto/create-project-stage.dto';
import { UpdateProjectStageDto } from './dto/update-project-stage.dto';
import { AuthGuard } from 'src/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('project-stages')
export class ProjectStagesController {
  constructor(private readonly projectStagesService: ProjectStagesService) {}

  @Post()
  create(@Body() createProjectStageDto: CreateProjectStageDto) {
    return this.projectStagesService.create(createProjectStageDto);
  }

  @Get()
  findAll() {
    return this.projectStagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectStagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectStageDto: UpdateProjectStageDto) {
    return this.projectStagesService.update(+id, updateProjectStageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectStagesService.remove(+id);
  }
}
