import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/authLogin.dto';
import { AuthForgetPasswordDto } from './dto/authForgetPassword.dto';
import { AuthCheckTokenDto } from './dto/authCheckToken.dto';
import { AuthResetPasswordDto } from './dto/authResetPassword.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequestToken } from 'src/decorators/requestToken.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() Body : AuthLoginDto) {
    try {
      return await this.authService.login(Body.email, Body.password)
    } catch (error) {
      throw error
    }
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@RequestToken() token: string) {
    try {
      return await this.authService.logout(token)
    } catch (error) {
      throw error
    }
  }
  
  @Post('forget-password')
  async forgetPassword(@Body() Body : AuthForgetPasswordDto) {
    try {
      return await this.authService.forgetPassword(Body.email)
    } catch (error) {
      throw error
    }
  }

  @Post('check-token')
  async checkToken(@Body() Body : AuthCheckTokenDto) {
    try {
      return await this.authService.checkTokenResetPassword(Body.token)
    } catch (error) {
      throw error
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() Body : AuthResetPasswordDto) {
    try {
      return await this.authService.resetPassword(Body.password, Body.token)
    } catch (error) {
      throw error
    }
  }




}
