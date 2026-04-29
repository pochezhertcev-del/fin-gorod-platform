import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 50 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;
}
