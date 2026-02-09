import { User } from 'src/users/entities/User.entity';
import { Project } from 'src/projects/entities/Project.entity';
import { Task } from 'src/tasks/entities/Task.entity';
import { UserRole } from 'src/users/user-role.enum';

/**
 * Helpers de permissão por recurso.
 * Project e Task devem vir com relations carregadas (userOwner, participants, user) quando necessário.
 */
export function isAdmin(user: User): boolean {
  return user.role === UserRole.ADMIN_GOD || user.role === UserRole.ADMIN_COLLABORATOR;
}

export function isAdminGod(user: User): boolean {
  return user.role === UserRole.ADMIN_GOD;
}

export function isProjectOwner(project: Project, user: User): boolean {
  return project.userOwner?.id === user.id;
}

export function isProjectParticipant(project: Project, user: User): boolean {
  if (!project.participants?.length) return false;
  return project.participants.some((p) => p.id === user.id);
}

/** Tem acesso ao projeto: é dono ou participante (ou admin). */
export function canAccessProject(project: Project, user: User): boolean {
  if (isAdmin(user)) return true;
  return isProjectOwner(project, user) || isProjectParticipant(project, user);
}

/** Pode gerenciar o projeto (update, remove, criar/editar colunas): dono ou admin. */
export function canManageProject(project: Project, user: User): boolean {
  if (isAdmin(user)) return true;
  return isProjectOwner(project, user);
}

export function isTaskOwner(task: Task, user: User): boolean {
  return task.user?.id === user.id;
}

/** Pode editar campos da tarefa (nome, descrição, data) mas não mover coluna nem remover: participante do projeto que não é dono da tarefa. */
export function canEditTaskFieldsOnly(project: Project, task: Task, user: User): boolean {
  if (isAdmin(user) || isTaskOwner(task, user)) return false; // esses têm permissão total, não "só campos"
  return canAccessProject(project, user);
}

/** Pode mover tarefa (coluna) ou remover: dono da tarefa ou admin. */
export function canMoveOrRemoveTask(task: Task, user: User): boolean {
  if (isAdmin(user)) return true;
  return isTaskOwner(task, user);
}
