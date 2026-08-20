import { isAdmin } from 'src/projects/project-permissions.helper';
import { User } from './entities/User.entity';

/** Pode listar/gestão global de utilizadores (admin). */
export function canManageUsers(actor: User): boolean {
  return isAdmin(actor);
}

/** Pode ler ou alterar o perfil do targetId (próprio ou admin). */
export function canAccessUserProfile(targetId: string, actor: User): boolean {
  return actor.id === targetId || isAdmin(actor);
}
