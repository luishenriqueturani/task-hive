import { PartialType } from '@nestjs/swagger';
import { CreateToDoDto } from './create-to-do.dto';

export class UpdateToDoDto extends PartialType(CreateToDoDto) {}
