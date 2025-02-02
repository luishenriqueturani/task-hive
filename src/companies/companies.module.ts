import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { companyProvider } from 'src/repository/providers/company.provider';
import { DatabaseModule } from 'src/repository/database.module';

@Module({
  controllers: [CompaniesController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...companyProvider,
    CompaniesService,
  ],
  imports: [
    DatabaseModule,
  ],
})
export class CompaniesModule { }
