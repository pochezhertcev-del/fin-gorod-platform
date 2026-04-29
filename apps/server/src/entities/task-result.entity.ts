import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
  Check,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity('task_results')
@Unique(['userId', 'taskId', 'attemptNumber'])
@Check(`"score" BETWEEN 0 AND 100`)
@Check(`"attempt_number" >= 1`)
export class TaskResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (u) => u.taskResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ name: 'task_id' })
  taskId: number;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  score: number;

  @Column({ name: 'is_correct' })
  isCorrect: boolean;

  // Time spent in milliseconds (simplified vs INTERVAL)
  @Column({ name: 'time_spent_ms', type: 'integer' })
  timeSpentMs: number;

  @Column({ name: 'answer_data', type: 'jsonb', nullable: true })
  answerData: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'completed_at' })
  completedAt: Date;
}
