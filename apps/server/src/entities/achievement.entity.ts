import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Check,
  Index,
} from 'typeorm';

export enum AchievementCategory {
  ACADEMIC = 'academic',
  SOCIAL = 'social',
  SPECIAL = 'special',
}

export interface AchievementConfig {
  condition_type: string;
  params: Record<string, number | string>;
  is_secret: boolean;
}

@Entity('achievements')
@Check(`"tier" BETWEEN 1 AND 3`)
@Check(`"category" IN ('academic', 'social', 'special')`)
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  @Column({ name: 'display_name', length: 255 })
  displayName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 30 })
  category: AchievementCategory;

  @Column({ type: 'integer' })
  tier: number;

  @Column({ type: 'jsonb' })
  config: AchievementConfig;

  @Column({ name: 'reward_coins', type: 'integer' })
  rewardCoins: number;

  @Column({ name: 'icon_url', length: 500, nullable: true })
  iconUrl: string | null;
}
