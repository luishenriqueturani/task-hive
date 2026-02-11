import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthLoginDto } from './dto/authLogin.dto';
import { AuthForgetPasswordDto } from './dto/authForgetPassword.dto';
import { AuthCheckTokenDto } from './dto/authCheckToken.dto';
import { AuthResetPasswordDto } from './dto/authResetPassword.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequestToken } from 'src/decorators/requestToken.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Autentica com email e senha. Retorna token JWT e dados do usuário (sem senha).' })
  @ApiBody({ type: AuthLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsIm5hbWUiOiJKb2FvIFNpbHZhIiwiZW1haWwiOiJ1c3VhcmlvQGVtYWlsLmNvbSIsInJvbGUiOiJDTElFTlQiLCJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpc3N1ZXIiOiJUYXNrSGl2ZSIsImF1ZGllbmNlIjoiTE9HSU4iLCJpYXQiOjE3MDk4MDAwMDAsImV4cCI6MTczOTMyNDAwMH0.xxx',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'João Silva',
          email: 'usuario@email.com',
          avatar: null,
          role: 'CLIENT',
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Usuário não cadastrado ou senha incorreta' })
  @ApiResponse({ status: 422, description: 'Dados inválidos (validação)' })
  async login(@Body() Body : AuthLoginDto) {
    try {
      return await this.authService.login(Body.email, Body.password)
    } catch (error) {
      throw error
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Logout', description: 'Invalida a sessão do token atual (remove do banco). Requer Bearer token no header Authorization.' })
  @ApiResponse({
    status: 200,
    description: 'Sessão encerrada (TypeORM DeleteResult)',
    schema: {
      example: {
        raw: [],
        affected: 1,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Sessão inválida' })
  @ApiResponse({ status: 401, description: 'Token inválido ou ausente' })
  async logout(@RequestToken() token: string) {
    try {
      return await this.authService.logout(token)
    } catch (error) {
      throw error
    }
  }
  
  @Post('forget-password')
  @ApiOperation({ summary: 'Esqueci a senha', description: 'Gera token de redefinição e associa ao usuário (email de envio pode ser implementado depois). Retorna true se o usuário existir.' })
  @ApiBody({ type: AuthForgetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Token de reset criado com sucesso (resposta literal do serviço)',
    schema: { example: true },
  })
  @ApiResponse({ status: 400, description: 'Usuário não cadastrado' })
  @ApiResponse({ status: 422, description: 'Email inválido' })
  async forgetPassword(@Body() Body : AuthForgetPasswordDto) {
    try {
      return await this.authService.forgetPassword(Body.email)
    } catch (error) {
      throw error
    }
  }

  @Post('check-token')
  @ApiOperation({ summary: 'Validar token de reset', description: 'Verifica se o token de redefinição existe no banco e é um JWT válido. Retorna true se válido.' })
  @ApiBody({ type: AuthCheckTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token válido (resposta literal do serviço)',
    schema: { example: true },
  })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  @ApiResponse({ status: 422, description: 'Body inválido (token não é JWT)' })
  async checkToken(@Body() Body : AuthCheckTokenDto) {
    try {
      return await this.authService.checkTokenResetPassword(Body.token)
    } catch (error) {
      throw error
    }
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha', description: 'Atualiza a senha do usuário usando o token de reset e retorna nova sessão (token + user), igual ao login.' })
  @ApiBody({ type: AuthResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada; nova sessão criada (mesmo formato do login)',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCIsIm5hbWUiOiJKb2FvIFNpbHZhIiwiZW1haWwiOiJ1c3VhcmlvQGVtYWlsLmNvbSIsInJvbGUiOiJDTElFTlQiLCJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpc3N1ZXIiOiJUYXNrSGl2ZSIsImF1ZGllbmNlIjoiTE9HSU4iLCJpYXQiOjE3MDk4MDAwMDAsImV4cCI6MTczOTMyNDAwMH0.xxx',
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'João Silva',
          email: 'usuario@email.com',
          avatar: null,
          role: 'CLIENT',
          createdAt: '2025-01-15T10:00:00.000Z',
          updatedAt: null,
          deletedAt: null,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Token inválido ou usuário inválido' })
  @ApiResponse({ status: 422, description: 'Senha não atende requisitos ou confirmPassword diferente de password' })
  async resetPassword(@Body() Body : AuthResetPasswordDto) {
    try {
      return await this.authService.resetPassword(Body.password, Body.token)
    } catch (error) {
      throw error
    }
  }




}
