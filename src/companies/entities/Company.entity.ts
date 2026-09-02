import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Project } from "../../projects/entities/Project.entity";
import { User } from "../../users/entities/User.entity";

@Entity()
export class Company {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({type: 'varchar', length: 255})
  name: string;

  @Column({ type: 'varchar', length: 255 })
  legalName: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  tradeName: string | null;

  @Column({ nullable: true, type: 'varchar', length: 14 })
  document: string | null;

  @OneToOne(() => User, (user) => user.ownedCompany, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ownerId' })
  owner: User | null;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP()" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", onUpdate: "CURRENT_TIMESTAMP()", nullable: true })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => Project, (project) => project.companyOwner)
  projects: Project[];
}
