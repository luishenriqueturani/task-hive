import { PartialType } from '@nestjs/mapped-types';
import { CreateToDoTypeDto } from './create-to-do-type.dto';

export class UpdateToDoTypeDto extends PartialType(CreateToDoTypeDto) {}
