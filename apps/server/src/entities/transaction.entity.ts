import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Check,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionSource {
  TASK_REWARD = 'task_reward',
  ACHIEVEMENT_BONUS = 'achievement_bonus',
  DAILY_BONUS = 'daily_bonus',
  SHOP_PURCHASE = 'shop_purchase',
  GOLDEN_BONUS = 'golden_bonus',
}

@Entity('transactions')
@Check(`"amount" > 0`)
@Check(`"transaction_type" IN ('credit', 'debit')`)
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'wallet_id' })
  walletId: number;

  @ManyToOne(() => Wallet, (w) => w.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ name: 'transaction_type', length: 20 })
  transactionType: TransactionType;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ length: 30 })
  source: TransactionSource;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
