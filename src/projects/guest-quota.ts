import { HttpException, HttpStatus } from '@nestjs/common';
import { isAdmin } from './project-permissions.helper';
import { User } from 'src/users/entities/User.entity';

/** Seed do trial até existir catálogo de planos (Onda 4). */
export const TRIAL_MAX_PROJECT_GUESTS = 2;
export const UNLIMITED_QUOTA = -1;

export function guestLimitForUser(user: User): number {
  if (isAdmin(user)) return UNLIMITED_QUOTA;
  return TRIAL_MAX_PROJECT_GUESTS;
}

export function hasGuestCapacity(used: number, limit: number): boolean {
  if (limit === UNLIMITED_QUOTA) return true;
  return used < limit;
}

export function planLimitGuestsException(limit: number, used: number) {
  return new HttpException(
    {
      code: 'PLAN_LIMIT_GUESTS',
      message: `O seu plano permite no máximo ${limit} convidados neste projeto.`,
      limit,
      used,
    },
    HttpStatus.PAYMENT_REQUIRED,
  );
}

export interface GuestUsage {
  used: number;
  limit: number;
  pendingInvites: number;
}
