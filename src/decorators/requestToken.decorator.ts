import { createParamDecorator, ExecutionContext } from "@nestjs/common"

export const RequestToken = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()

  if(!request.token) {
    throw new Error('Token não encontrado. Use AuthGuard antes de usar RequestToken')
  }

  return request.token
})


