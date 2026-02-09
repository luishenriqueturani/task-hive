import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Define quais roles podem acessar a rota.
 * Uso: @Roles(UserRole.ADMIN_GOD) ou @Roles(UserRole.ADMIN_GOD, UserRole.ADMIN_COLLABORATOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
