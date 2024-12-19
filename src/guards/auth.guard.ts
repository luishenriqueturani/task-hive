import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JWTAudience } from "src/auth/auth.enums";
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

      //console.log(token)

      if(!token) {
        return false
      }

      request.token = token

      const res = this.authService.checkToken(token, {
        audience: JWTAudience.LOGIN,
        issuer: 'TaskHive',
      })

      //console.log(res)

      request.tokenPayload = res

      const session = await this.authService.findSessionByToken(token)

      if(!session) {
        return false
      }

      request.session = session

      //console.log(session)

      request.user = session.user

      //console.log(request.user)

      return true

    } catch (error) {
      return false
    }
  }
  
}