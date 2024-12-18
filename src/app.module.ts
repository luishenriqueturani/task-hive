import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { SnowflakeIdService } from './snowflakeid/snowflakeid.service';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    SnowflakeIdService,
    AppService
  ],
})
export class AppModule { }
