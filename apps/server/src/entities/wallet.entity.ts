import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  Check,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

// CHECK (balance >= 0) — DB-level guarantee against negative balance (section 2.2)
@Entity('wallets')
@Check(`"balance" >= 0`)
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'user_id' })
  userId: number;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @OneToMany(() => Transaction, (t) => t.wallet, { cascade: true })
  transactions: Transaction[];
}
