import { DataSource } from "typeorm";
import { PostgreSQLTokens } from "../postgresql.enums";
import { ForgetPassword } from "src/auth/entities/ForgetPassword.entity";


export const forgetPasswordProviders = [
  {
    provide: PostgreSQLTokens.FORGET_PASSWORD,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(ForgetPassword),
    inject: [PostgreSQLTokens.DATA_SOURCE],
  }
];