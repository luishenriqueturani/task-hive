import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DatabaseModule } from 'src/repository/database.module';
import { supportProviders } from 'src/repository/providers/support.provider';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SupportController],
  providers: [...supportProviders, SupportService, SupportGateway],
  exports: [...supportProviders, SupportService],
})
export class SupportModule {}
