/**
 * Níveis de usuário para permissionamento.
 * - ADMIN_GOD: acesso total, inclusive hard delete.
 * - ADMIN_COLLABORATOR: quase tudo, sem hard delete.
 * - CLIENT: CRUD nos próprios recursos; em recursos de outros, apenas leitura + criar tarefa e editar campos da tarefa (sem mover/remover).
 */
export enum UserRole {
  ADMIN_GOD = 'ADMIN_GOD',
  ADMIN_COLLABORATOR = 'ADMIN_COLLABORATOR',
  CLIENT = 'CLIENT',
}
