import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Check,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Task } from './task.entity';

export enum TopicCategory {
  MONEY_FUNCTIONS = 'money_functions',
  INCOME_EXPENSES = 'income_expenses',
  FAMILY_BUDGET = 'family_budget',
  SAVINGS = 'savings',
  PURCHASES_PRICES = 'purchases_prices',
  BANKING_SERVICES = 'banking_services',
}

@Entity('lessons')
@Check(`"difficulty_level" BETWEEN 1 AND 5`)
@Check(
  `"topic_category" IN ('money_functions','income_expenses','family_budget','savings','purchases_prices','banking_services')`,
)
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Index()
  @Column({ name: 'topic_category', length: 50 })
  topicCategory: TopicCategory;

  @Column({ name: 'difficulty_level', type: 'integer' })
  difficultyLevel: number;

  // JSONB allows variable structure for different lesson types (section 2.2)
  @Column({ type: 'jsonb' })
  content: Record<string, unknown>;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.lesson, { cascade: true })
  tasks: Task[];
}
