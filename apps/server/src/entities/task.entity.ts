import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
} from 'typeorm';
import { Lesson } from './lesson.entity';

export enum TaskType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCHING = 'matching',
  OPEN_ANSWER = 'open_answer',
  GAME_SCENARIO = 'game_scenario',
}

@Entity('tasks')
@Check(
  `"task_type" IN ('multiple_choice','matching','open_answer','game_scenario')`,
)
@Check(`"reward_coins" BETWEEN 1 AND 100`)
@Check(`"max_attempts" >= 1`)
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'lesson_id' })
  lessonId: number;

  @ManyToOne(() => Lesson, (l) => l.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ name: 'task_type', length: 30 })
  taskType: TaskType;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  // Config structure varies by task_type (section 2.2)
  @Column({ type: 'jsonb' })
  config: Record<string, unknown>;

  @Column({ name: 'reward_coins', type: 'integer', default: 10 })
  rewardCoins: number;

  // Difficulty level inherited from lesson; duplicated for fast filtering
  @Column({ name: 'difficulty_level', type: 'integer', default: 1 })
  difficultyLevel: number;

  @Column({ name: 'order_index', type: 'integer' })
  orderIndex: number;

  @Column({ name: 'max_attempts', type: 'integer', default: 3 })
  maxAttempts: number;
}
