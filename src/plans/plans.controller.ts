import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'Catálogo público de planos',
    description: 'Planos activos que não são de sistema (exclui o trial).',
  })
  @ApiOkResponse({ description: 'Lista de planos comerciais' })
  findPublic() {
    return this.plans.findPublic();
  }
}
