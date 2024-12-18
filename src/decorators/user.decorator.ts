import { BadRequestException, createParamDecorator, ExecutionContext } from "@nestjs/common";


export const User = createParamDecorator((filter: string, ctx: ExecutionContext) => {

  const request = ctx.switchToHttp().getRequest()

  if(!request.user) {
    throw new BadRequestException('Usuário não encontrado. Use AuthGuard antes de usar User')
  }

  return filter ? request.user[filter] : request.user
})
