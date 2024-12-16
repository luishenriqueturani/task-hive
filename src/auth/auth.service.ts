import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { User } from 'src/repository/entities/User.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Crypt } from 'src/utils/crypt';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>,
  ) { }

  async createToken(user: User) {
    return this.jwtService.sign({
      id: user.id,
      name: user.name,
      email: user.email,
    },{
      subject: user.id,
      issuer: 'task-hive',
      audience: 'task-hive', // Nível do usuário
      expiresIn: '90d',// 3 meses
    });
  }

  async checkToken(token: string, options?: JwtVerifyOptions) {
    try {
      
      return this.jwtService.verify(token, options);

    } catch (error) {
      throw new BadRequestException('Token inválido')
    }
  }

  /**
   * 
   * @param email string
   * @param password string
   * 
   * @returns 
   */
  async login(email: string, password: string) {

    const user = await this.findFirstUserByEmail(email)

    if(!user) {
      throw new BadRequestException('Usuário não cadastrado')
    }

    if(user.password !== await Crypt.hash(password)) {
      throw new BadRequestException('Senha incorreta')
    }



  }

  async logout() {

  }

  async forgetPassword(email: string) {
    const user = await this.findFirstUserByEmail(email)

    if(!user) {
      throw new BadRequestException('Usuário não cadastrado')
    }
  }

  async resetPassword() {

  }

  async checkTokenResetPassword() {

  }

  async findFirstUserByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

}
