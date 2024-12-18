import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from "src/auth/auth.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext){
    
    const request = context.switchToHttp().getRequest()

    const authorization = request.headers.authorization

    try {

      const token = authorization?.replace('Bearer ', '')

      if(!token) {
        return false
      }

      request.token = token

      const res = this.authService.checkToken(token)

      request.tokenPayload = res

      request.user = await this.userService.findOne(res.id)

      return true

    } catch (error) {
      return false
    }
  }
  
}