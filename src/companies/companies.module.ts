import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { companyProvider } from 'src/repository/providers/company.provider';
import { DatabaseModule } from 'src/repository/database.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [CompaniesController],
  providers: [...companyProvider, CompaniesService],
  imports: [AuthModule, DatabaseModule],
})
export class CompaniesModule {}
