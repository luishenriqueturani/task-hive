import { HttpException } from '@nestjs/common';
import {
  guestLimitForUser,
  hasGuestCapacity,
  planLimitGuestsException,
  TRIAL_MAX_PROJECT_GUESTS,
  UNLIMITED_QUOTA,
} from './guest-quota';
import { User } from 'src/users/entities/User.entity';
import { UserRole } from 'src/users/user-role.enum';

describe('guest-quota', () => {
  const client = { role: UserRole.CLIENT } as User;
  const admin = { role: UserRole.ADMIN_GOD } as User;

  it('trial para cliente e ilimitado para admin', () => {
    expect(guestLimitForUser(client)).toBe(TRIAL_MAX_PROJECT_GUESTS);
    expect(guestLimitForUser(admin)).toBe(UNLIMITED_QUOTA);
  });

  it('capacidade compara used com o tecto', () => {
    expect(hasGuestCapacity(1, 2)).toBe(true);
    expect(hasGuestCapacity(2, 2)).toBe(false);
    expect(hasGuestCapacity(99, UNLIMITED_QUOTA)).toBe(true);
  });

  it('402 PLAN_LIMIT_GUESTS', () => {
    const err = planLimitGuestsException(2, 2);
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(402);
    expect(err.getResponse()).toMatchObject({
      code: 'PLAN_LIMIT_GUESTS',
      limit: 2,
      used: 2,
    });
  });
});
