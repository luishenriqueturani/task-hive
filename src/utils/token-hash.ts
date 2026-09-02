import { createHash, randomBytes } from 'crypto';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return `th_rf_${randomBytes(32).toString('base64url')}`;
}

export function generateProjectInviteToken(): string {
  return `th_inv_${randomBytes(24).toString('base64url')}`;
}

export function generatePersonalAccessToken(): string {
  return `th_pat_${randomBytes(32).toString('base64url')}`;
}

export const PERSONAL_ACCESS_TOKEN_PREFIX = 'th_pat_';
