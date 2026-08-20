import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/User.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Crypt } from 'src/utils/crypt';
import { AppMetricsService } from 'src/metrics/app-metrics.service';
import { canAccessUserProfile, canManageUsers } from './user-permissions.helper';

const PUBLIC_USER_SELECT = {
  password: false as const,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  id: true,
  name: true,
  email: true,
  role: true,
};

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
        where: { deletedAt: null },
        select: PUBLIC_USER_SELECT,
      }),
    );
  }

  search(query: string, limit = 20) {
    const q = query.trim();
    if (q.length < 2) {
      throw new BadRequestException('Informe ao menos 2 caracteres para buscar');
    }
    return this.metrics.track('users', 'search', () =>
      this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.avatar',
          'user.role',
        ])
        .where('user.deletedAt IS NULL')
        .andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', { q: `%${q}%` })
        .orderBy('user.name', 'ASC')
        .take(Math.min(limit, 50))
        .getMany(),
    );
  }

  findOne(id: string, actor: User) {
    return this.metrics.track('users', 'find_one', async () => {
      if (!canAccessUserProfile(id, actor)) {
        throw new NotFoundException('Usuário não encontrado');
      }
      const user = await this.userRepository.findOne({
        where: { id, deletedAt: null },
        select: PUBLIC_USER_SELECT,
      });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }
      return user;
    });
  }

  /**
   * Soft delete: marca deletedAt. Impede auto-delete.
   * Apenas admin ou o próprio utilizador (via remove com regra de self).
   */
  async remove(id: string, actor: User) {
    return this.metrics.track('users', 'remove', async () => {
      if (!canAccessUserProfile(id, actor)) {
        throw new NotFoundException('User not found');
      }
      if (id === actor.id) {
        throw new HttpException('Não é permitido remover a própria conta', HttpStatus.FORBIDDEN);
      }
      if (!canManageUsers(actor)) {
        throw new NotFoundException('User not found');
      }
      const user = await this.findOneUntracked(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return this.userRepository.update(id, {
        deletedAt: new Date(),
      });
    });
  }

  findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
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

  async update(id: string, updateUserDto: UpdateUserDto, actor: User) {
    return this.metrics.track('users', 'update', async () => {
      if (!canAccessUserProfile(id, actor)) {
        throw new NotFoundException('User not found');
      }
      const user = await this.findOneUntracked(id);

      if(!user) {
        throw new NotFoundException('User not found');
      }

      if(user.email !== updateUserDto.email) {
        const existing = await this.findByEmail(updateUserDto.email);
        if(existing && existing.id !== id) {
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

  async softDelete(id: string, actor: User) {
    return this.metrics.track('users', 'soft_delete', async () => {
      if (!canManageUsers(actor)) {
        throw new NotFoundException('User not found');
      }
      if (id === actor.id) {
        throw new HttpException('Não é permitido remover a própria conta', HttpStatus.FORBIDDEN);
      }
      if(!await this.findOneUntracked(id)) {
        throw new NotFoundException('User not found');
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
      select: PUBLIC_USER_SELECT,
    });
  }
}
