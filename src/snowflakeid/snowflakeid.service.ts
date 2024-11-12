import { Injectable } from "@nestjs/common";
import { SnowflakeId } from "./SnowflakeId";


@Injectable()
export class SnowflakeIdService {
  private snowflake: SnowflakeId;

  constructor() {
    // Configura o SnowflakeId com os IDs de worker e datacenter.
    this.snowflake = new SnowflakeId(1, 1);
  }

  generateId(): bigint {
    return this.snowflake.nextId();
  }
}