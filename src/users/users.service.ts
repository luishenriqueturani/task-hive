import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/User.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Crypt } from 'src/utils/crypt';
import { AppMetricsService } from 'src/metrics/app-metrics.service';

@Injectable()
export class UsersService {

  constructor(
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>,
    private readonly metrics: AppMetricsService,
  ) { }


  findAll() {
    return this.metrics.track('users', 'find_all', () =>
      this.userRepository.find({
        select: {
          password: false,
          avatar: true,
          createdAt: true,
          updatedAt: true, 
          deletedAt: true,
          id: true,
          name: true,
          email: true,
        }
      }),
    );
  }

  findOne(id: string) {
    return this.metrics.track('users', 'find_one', () =>
      this.userRepository.findOne({
        where: {
          id,
          deletedAt: null
        },
        select: {
          password: false,
          avatar: true,
          createdAt: true,
          updatedAt: true, 
          deletedAt: true,
          id: true,
          name: true,
          email: true,
        }
      }),
    );
  }

  /**
   * Soft delete: marca deletedAt. Hard delete restrito a ADMIN_GOD (Fase 3).
   * Impede auto-delete: usuário não pode remover a si mesmo.
   */
  async remove(id: string, currentUserId?: string) {
    return this.metrics.track('users', 'remove', async () => {
      const user = await this.findOneUntracked(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      if (currentUserId && id === currentUserId) {
        throw new HttpException('Não é permitido remover a própria conta', HttpStatus.FORBIDDEN);
      }
      return this.userRepository.update(id, {
        deletedAt: new Date(),
      });
    });
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      //withDeleted: true,
      where: {
        email,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    return this.metrics.track('users', 'create', async () => {
      if (await this.findByEmail(createUserDto.email)) {
        throw new HttpException('Email already exists', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const user = await this.userRepository.save({
        avatar: createUserDto.avatar,
        email: createUserDto.email,
        name: createUserDto.name,
        password: await Crypt.hash(createUserDto.password),
        updatedAt: null,
      })

      if(!user) {
        throw new BadRequestException('Não foi possível criar o usuário');
      }

      user.password = undefined;

      return user;
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.metrics.track('users', 'update', async () => {
      const user = await this.findOneUntracked(id);

      if(!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if(user.email !== updateUserDto.email) {
        const existing = await this.findByEmail(updateUserDto.email);
        if(existing) {
          throw new HttpException('Email already exists', HttpStatus.UNPROCESSABLE_ENTITY);
        }
      }

      return this.userRepository.update(id, {
        avatar: updateUserDto.avatar,
        email: updateUserDto.email,
        name: updateUserDto.name,
      });
    });
  }

  async softDelete(id: string) {
    return this.metrics.track('users', 'soft_delete', async () => {
      if(!await this.findOneUntracked(id)) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return this.userRepository.update(id, {
        deletedAt: new Date(),
      });
    });
  }

  /** Internal lookup without double-counting find_one metrics. */
  private findOneUntracked(id: string) {
    return this.userRepository.findOne({
      where: {
        id,
        deletedAt: null
      },
      select: {
        password: false,
        avatar: true,
        createdAt: true,
        updatedAt: true, 
        deletedAt: true,
        id: true,
        name: true,
        email: true,
      }
    });
  }
}
