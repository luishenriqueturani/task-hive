import { SnowflakeIdService } from "src/snowflakeid/snowflakeid.service";
import { BeforeInsert, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User.entity";

@Entity()
export class UserFriendship {

  @PrimaryColumn('bigint')
  id: bigint

  @ManyToOne(() => User, user => user.friendship1)
  user1: User

  @ManyToOne(() => User, user => user.friendship2)
  user2: User

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  constructor(
    private snowflakeIdService: SnowflakeIdService
  ) {}


  @BeforeInsert()
  async generateId() {
    this.id = this.snowflakeIdService.generateId();
  }

}
