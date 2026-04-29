import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { Wallet } from './wallet.entity';
import { TaskResult } from './task-result.entity';
import { UserAchievement } from './user-achievement.entity';

export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: number;

  // Recursive: for students references parent user; SET NULL on parent deletion (152-FZ)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: User | null;

  @Column({ name: 'parent_id', nullable: true })
  parentId: number | null;

  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date | null;

  // Consent for personal data processing (152-FZ Art. 9)
  @Column({ name: 'consent_given', default: false })
  consentGiven: boolean;

  @Column({ name: 'consent_date', type: 'timestamp', nullable: true })
  consentDate: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Adaptive difficulty level (1-5), section 2.3
  @Column({ name: 'difficulty_level', default: 1 })
  difficultyLevel: number;

  @Column({ name: 'last_difficulty_change_at', type: 'timestamp', nullable: true })
  lastDifficultyChangeAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Wallet, (wallet) => wallet.user, { cascade: true })
  wallet: Wallet;

  @OneToMany(() => TaskResult, (tr) => tr.user)
  taskResults: TaskResult[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  achievements: UserAchievement[];
}
