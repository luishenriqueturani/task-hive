import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
  ) { }

  async createToken(user: any) {
    return this.jwtService.sign(user);
  }

  async checkToken(token: string) {
    return this.jwtService.verify(token);
  }

  async login(){

  }

  async logout(){

  }

  async forgetPassword(){

  }

  async resetPassword(){

  }

  async checkTokenResetPassword(){

  }

}
