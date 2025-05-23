import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { User } from 'src/users/entities/User.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Crypt } from 'src/utils/crypt';
import { Repository } from 'typeorm';
import { JWTAudience } from './auth.enums';
import { ConfigService } from '@nestjs/config';
import { ForgetPassword } from './entities/ForgetPassword.entity';
import { Session } from './entities/Session.entity';


export interface SessionResponse {
  token: string,
  user: User
}

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>,

    @Inject(PostgreSQLTokens.FORGET_PASSWORD)
    private forgetPasswordRepository: Repository<ForgetPassword>,

    @Inject(PostgreSQLTokens.SESSION_REPOSITORY)
    private sessionRepository: Repository<Session>,

    private readonly configService: ConfigService,
  ) { }

  /**
   * 
   * @param user User
   * @param audience JWTAudience
   * @param expiresIn string
   * @returns string
   */
  async createToken(user: User, audience: JWTAudience, expiresIn: string = '90d') {
    //console.log(user)
    return this.jwtService.sign({
      id: user.id,
      name: user.name,
      email: user.email,
    },{
      subject: user.id,
      issuer: 'TaskHive',
      audience: audience, // Nível do usuário
      expiresIn: expiresIn,
    });
  }

  /**
   * 
   * @param token string
   * @param options JwtVerifyOptions
   * @returns boolean
   */
  checkToken(token: string, options?: JwtVerifyOptions) {
    try {
      const res = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwtSecret'),
        ...options
      });
      //console.log(res)
      return res

    } catch (error) {
      console.log(error)
      throw new BadRequestException('Token inválido')
    }
  }

  /**
   * 
   * @param email string
   * @param password string
   * 
   * @returns SessionResponse
   */
  async login(email: string, password: string) {

    const user = await this.findFirstUserByEmail(email)

    if(!user) {
      throw new BadRequestException('Usuário não cadastrado')
    }
    try {
      
      //console.log(await Crypt.compare(password, user.password))
  
      if(!await Crypt.compare(password, user.password)) {
        throw new BadRequestException('Senha incorreta')
      }
      
      return this.createSession(user)

    } catch (error) {
      console.log(error)
      throw new BadRequestException('Senha incorreta')
    }
  }

  /**
   * 
   * @param token string
   * @returns Promise<DeleteResult>
   */
  async logout(token: string) {
    const session = await this.findSessionByToken(token)

    if(!session) {
      throw new BadRequestException('Sessão inválida')
    }

    return await this.sessionRepository.delete({
      id: session.id,
    })
  }

  /**
   * 
   * @param email string
   * @returns boolean
   */
  async forgetPassword(email: string) {
    const user = await this.findFirstUserByEmail(email)

    if(!user) {
      throw new BadRequestException('Usuário não cadastrado')
    }

    const expiresIn = new Date()

    expiresIn.setDate(expiresIn.getDate() + 1)

    const res = await this.forgetPasswordRepository.save({
      user,
      token: await this.createToken(user, JWTAudience.FORGET_PASSWORD, expiresIn.getTime().toString()),
    })

    // enviar email

    return !!res
  }

  /**
   * 
   * @param password string
   * @param token string
   * @returns SessionResponse
   */
  async resetPassword(password: string, token: string) {

    const check = this.checkTokenResetPassword(token)

    if (!check) {
      throw new BadRequestException('Token inválido')
    }

    const fp = await this.forgetPasswordRepository.findOne({
      where: {
        token,
      },
    })

    if (!fp) {
      throw new BadRequestException('Token inválido')
    }

    const user = await this.userRepository.findOne({
      where: {
        id: fp.user.id,
      },
    })

    if (!user) {
      throw new BadRequestException('Usuário inválido')
    }

    user.password = await Crypt.hash(password)

    const update = await this.userRepository.save(user)

    if (!update) {
      throw new BadRequestException('Falha ao atualizar usuário')
    }

    // enviar email de aviso de alteração de senha

    return this.createSession(user)
  }

  /**
   * 
   * @param token string
   * @returns boolean
   */
  async checkTokenResetPassword(token: string) {

    const check = this.checkToken(token)

    if (!check) {
      throw new BadRequestException('Token inválido')
    }

    const res = await this.forgetPasswordRepository.findOne({
      where: {
        token,
      },
    })

    return !!res
  }

  /**
   * 
   * @param email string
   * @returns User
   */
  async findFirstUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  /**
   * 
   * @param token string
   * @returns Session
   */
  async findSessionByToken(token: string) {
    return this.sessionRepository.findOne({
      where: {
        token,
      },
      select: {
        token: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        id: true,
        user: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        }
      },
      relations: ['user'],
      withDeleted: false,

    });
  }

  /**
   * 
   * @param user User
   * @returns SessionResponse
   */
  async createSession(user: User) {
    const newToken = await this.createToken(user, JWTAudience.LOGIN)

    const res = await this.sessionRepository.save({
      user,
      token: newToken,
    })

    if(!res) {
      throw new BadRequestException('Não foi possível criar sessão')
    }

    user.password = undefined

    return {
      token: newToken,
      user,
    }
  }

}
