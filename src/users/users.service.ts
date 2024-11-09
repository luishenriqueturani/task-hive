import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from 'src/repository/entities/user.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { Crypt } from 'src/utils/crypt';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Injectable()
export class UsersService {

  constructor(
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>
  ) { }


  findAll() {
    return this.userRepository.find({
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

  findOne(id: string) {
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

  async remove(id: string) {
    if(!await this.findOne(id)) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return this.userRepository.delete(id);
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async create(createUserDto: CreateUserDto) {

    if (await this.findByEmail(createUserDto.email)) {
      throw new HttpException('Email already exists', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    return this.userRepository.save({
      avatar: createUserDto.avatar,
      email: createUserDto.email,
      name: createUserDto.name,
      password: await Crypt.hash(createUserDto.password),
      updatedAt: null,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    const user = await this.findOne(id);

    if(!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if(user.email !== updateUserDto.email) {
      const user = await this.findByEmail(updateUserDto.email);
      if(user) {
        throw new HttpException('Email already exists', HttpStatus.UNPROCESSABLE_ENTITY);
      }
    }

    return this.userRepository.update(id, {
      avatar: updateUserDto.avatar,
      email: updateUserDto.email,
      name: updateUserDto.name,
    });
  }

  async softDelete(id: string) {

    if(!await this.findOne(id)) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.userRepository.update(id, {
      deletedAt: new Date(),
    });
  }
}
