
import * as bcrypt from 'bcrypt';

export class Crypt {

  public static hash(password: string) {
    return bcrypt.hash(password, Number(process.env.CRYPT_SAULT));
  }

  public static compare(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

}

