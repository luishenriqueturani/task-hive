import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostgreSQLTokens } from 'src/repository/postgresql.enums';
import { User } from 'src/users/entities/User.entity';
import { PersonalAccessToken } from './entities/PersonalAccessToken.entity';
import { CreatePersonalAccessTokenDto } from './dto/create-personal-access-token.dto';
import {
  generatePersonalAccessToken,
  hashToken,
} from 'src/utils/token-hash';

const DEFAULT_PAT_EXPIRES_DAYS = 90;
const MAX_PAT_EXPIRES_DAYS = 365;

@Injectable()
export class PersonalAccessTokensService {
  constructor(
    @Inject(PostgreSQLTokens.PERSONAL_ACCESS_TOKEN_REPOSITORY)
    private readonly patRepository: Repository<PersonalAccessToken>,
  ) {}

  async listForUser(user: User) {
    const rows = await this.patRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toPublic(row));
  }

  async create(user: User, dto: CreatePersonalAccessTokenDto) {
    const days = Math.min(
      Math.max(dto.expiresInDays ?? DEFAULT_PAT_EXPIRES_DAYS, 1),
      MAX_PAT_EXPIRES_DAYS,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const token = generatePersonalAccessToken();
    const saved = await this.patRepository.save({
      user,
      name: dto.name.trim(),
      tokenHash: hashToken(token),
      tokenPrefix: token.slice(0, 16),
      expiresAt,
    });

    return {
      ...this.toPublic(saved),
      token,
    };
  }

  async revoke(user: User, id: string) {
    const row = await this.patRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!row) throw new NotFoundException('Token não encontrado');
    if (row.user.id !== user.id) {
      throw new ForbiddenException('Sem permissão para revogar este token');
    }
    await this.patRepository.delete({ id });
    return { success: true };
  }

  private toPublic(row: PersonalAccessToken) {
    return {
      id: row.id,
      name: row.name,
      tokenPrefix: row.tokenPrefix,
      expiresAt: row.expiresAt,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    };
  }
}
