import * as bcrypt from 'bcrypt';

/** Rounds do bcrypt: use CRYPT_SALT (nome canónico); CRYPT_SAULT mantém compatibilidade com ambientes antigos. */
function bcryptSaltRounds(): number {
  const raw = process.env.CRYPT_SALT ?? process.env.CRYPT_SAULT ?? '10';
  return Number(raw);
}

export class Crypt {

  public static hash(password: string) {
    return bcrypt.hash(password, bcryptSaltRounds());
  }

  public static compare(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

}

