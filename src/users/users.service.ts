import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from 'src/repository/entities/user.entity';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';

@Injectable()
export class UsersService {

  constructor(
    @Inject(PostgreSQLTokens.USER_REPOSITORY)
    private userRepository: Repository<User>
  ) { }

  
  findAll() {
    return this.userRepository.find();
  }
  
  findOne(id: string) {
    return this.userRepository.find({
      where: {
        id,
      },
    });
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }
  
  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }
}
