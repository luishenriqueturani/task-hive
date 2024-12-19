import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DatabaseModule } from 'src/repository/database.module';
import { userProviders } from 'src/repository/providers/user.provider';
import { sessionProviders } from 'src/repository/providers/session.provider';
import { forgetPasswordProviders } from 'src/repository/providers/forgetPassword.provider';
import { UsersService } from 'src/users/users.service';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        //console.log(configService.get<string>('jwtSecret'))
        return {
          secret: configService.get<string>('jwtSecret'),
          signOptions: { expiresIn: '90d' },
        }
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    ...userProviders,
    ...sessionProviders,
    ...forgetPasswordProviders,
    UsersService,
    AuthService,
  ],
  exports: [
    JwtModule,
  ],
})
export class AuthModule { }
