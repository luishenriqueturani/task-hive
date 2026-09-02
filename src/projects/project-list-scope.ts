import { BadRequestException } from '@nestjs/common';

export const PROJECT_LIST_SCOPES = ['all', 'owned', 'invited'] as const;

export type ProjectListScope = (typeof PROJECT_LIST_SCOPES)[number];

/** Query `scope` de GET /projects. Default `all` (compatível com a listagem antiga). */
export function parseProjectListScope(raw?: string): ProjectListScope {
  if (raw == null || raw === '') return 'all';
  if (raw === 'all' || raw === 'owned' || raw === 'invited') return raw;
  throw new BadRequestException('scope must be owned, invited or all');
}
