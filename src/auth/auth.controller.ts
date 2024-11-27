import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/authLogin.dto';
import { AuthForgetPasswordDto } from './dto/authForgetPassword.dto';
import { AuthCheckTokenDto } from './dto/authCheckToken.dto';
import { AuthResetPasswordDto } from './dto/authResetPassword.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() Body : AuthLoginDto) {
    
  }

  @Post('forget-password')
  async forgetPassword(@Body() Body : AuthForgetPasswordDto) {
    
  }

  @Post('check-token')
  async checkToken(@Body() Body : AuthCheckTokenDto) {
    
  }

  @Post('reset-password')
  async resetPassword(@Body() Body : AuthResetPasswordDto) {
    
  }

  @Post('logout')
  async logout() {
    
  }



}
