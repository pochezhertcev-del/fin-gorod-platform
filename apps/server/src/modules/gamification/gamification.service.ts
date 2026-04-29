import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import * as crypto from 'crypto';
import {
  Wallet,
  Transaction,
  TransactionType,
  TransactionSource,
  Task,
  TaskResult,
  Achievement,
  UserAchievement,
} from '../../entities';

/**
 * Difficulty multipliers per level (section 2.3, table 2.13)
 * Level 1 = baseline, Level 5 = expert (2.5x reward)
 */
export const DIFFICULTY_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 1.8,
  5: 2.5,
};

/**
 * Golden bonus probability (section 2.3)
 * Variable-ratio reinforcement (Skinner's operant conditioning theory)
 */
export const GOLDEN_BONUS_PROBABILITY = 0.15;

export interface RewardResult {
  reward: number;
  isGolden: boolean;
  newBalance: number;
  newAchievements: number[];
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Pure function for testability.
   * Implements formula R from section 2.3:
   *   R = ⌈(score / 100) × reward_coins × difficulty_multiplier × golden_multiplier⌉
   */
  calculateReward(
    score: number,
    rewardCoins: number,
    difficultyLevel: number,
    isGolden: boolean,
  ): number {
    if (score <= 0) return 0;
    if (score > 100) score = 100;

    const diffMult = DIFFICULTY_MULTIPLIERS[difficultyLevel] ?? 1.0;
    const goldenMult = isGolden ? 2 : 1;

    return Math.ceil((score / 100) * rewardCoins * diffMult * goldenMult);
  }

  /**
   * Cryptographically secure RNG for golden bonus determination.
   * Returns true with probability GOLDEN_BONUS_PROBABILITY.
   */
  rollGoldenBonus(): boolean {
    return crypto.randomInt(0, 100) < GOLDEN_BONUS_PROBABILITY * 100;
  }

  /**
   * ACID transaction: task completion reward (section 2.2).
   * - Creates task_result
   * - Creates credit transaction
   * - Updates wallet balance (with pessimistic write lock)
   * - Checks achievement conditions
   * All atomic: full rollback on any error.
   */
  async processTaskReward(
    userId: number,
    taskId: number,
    score: number,
    isCorrect: boolean,
    timeSpentMs: number,
    answerData: Record<string, unknown> | null,
  ): Promise<RewardResult> {
    return this.dataSource.transaction(async (manager) => {
      const task = await manager.findOneByOrFail(Task, { id: taskId });
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ${userId}`);
      }

      const isGolden = isCorrect && this.rollGoldenBonus();
      const reward = this.calculateReward(
        score,
        task.rewardCoins,
        task.difficultyLevel,
        isGolden,
      );

      // Get current attempt number
      const previousAttempts = await manager.count(TaskResult, {
        where: { userId, taskId },
      });

      // Save task result
      await manager.save(TaskResult, {
        userId,
        taskId,
        attemptNumber: previousAttempts + 1,
        score,
        isCorrect,
        timeSpentMs,
        answerData,
      });

      let newAchievements: number[] = [];

      if (reward > 0) {
        // Save transaction record (audit trail)
        await manager.save(Transaction, {
          walletId: wallet.id,
          transactionType: TransactionType.CREDIT,
          amount: reward,
          source: isGolden
            ? TransactionSource.GOLDEN_BONUS
            : TransactionSource.TASK_REWARD,
          referenceId: taskId,
        });

        // Update balance atomically
        wallet.balance += reward;
        await manager.save(wallet);
      }

      // Check achievement conditions inside same transaction
      newAchievements = await this.checkAchievements(userId, manager);

      return {
        reward,
        isGolden,
        newBalance: wallet.balance,
        newAchievements,
      };
    });
  }

  /**
   * Shop purchase: debit transaction (section 2.2).
   * CHECK constraint at DB level prevents negative balance.
   */
  async purchaseItem(
    userId: number,
    itemId: number,
    cost: number,
  ): Promise<{ newBalance: number }> {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < cost) {
        throw new Error('Insufficient balance');
      }

      await manager.save(Transaction, {
        walletId: wallet.id,
        transactionType: TransactionType.DEBIT,
        amount: cost,
        source: TransactionSource.SHOP_PURCHASE,
        referenceId: itemId,
      });

      wallet.balance -= cost;
      await manager.save(wallet);

      return { newBalance: wallet.balance };
    });
  }

  /**
   * Adaptive difficulty algorithm (section 2.3).
   * Uses sliding window of last N=10 task results.
   * Score thresholds: < 50 → decrease, 50-85 → stay, > 85 → increase.
   */
  async computeAdaptiveDifficulty(
    userId: number,
    currentLevel: number,
    windowSize = 10,
  ): Promise<number> {
    const results = await this.dataSource
      .getRepository(TaskResult)
      .createQueryBuilder('tr')
      .where('tr.user_id = :userId', { userId })
      .orderBy('tr.completed_at', 'DESC')
      .limit(windowSize)
      .getMany();

    if (results.length < 5) {
      // Not enough data for adaptation
      return currentLevel;
    }

    const avgScore =
      results.reduce((sum, r) => sum + Number(r.score), 0) / results.length;

    if (avgScore > 85 && currentLevel < 5) return currentLevel + 1;
    if (avgScore < 50 && currentLevel > 1) return currentLevel - 1;
    return currentLevel;
  }

  /**
   * Achievement condition checker (section 2.3).
   * Iterates over not-yet-earned achievements and evaluates conditions.
   * Returns IDs of newly earned achievements.
   */
  async checkAchievements(
    userId: number,
    manager: EntityManager,
  ): Promise<number[]> {
    const earned = await manager
      .createQueryBuilder(UserAchievement, 'ua')
      .select('ua.achievement_id', 'id')
      .where('ua.user_id = :userId', { userId })
      .getRawMany();

    const earnedIds = new Set(earned.map((e) => e.id));

    const allAchievements = await manager.find(Achievement);
    const newlyEarned: number[] = [];

    for (const ach of allAchievements) {
      if (earnedIds.has(ach.id)) continue;

      const meets = await this.evaluateCondition(userId, ach, manager);
      if (meets) {
        await manager.save(UserAchievement, {
          userId,
          achievementId: ach.id,
        });

        // Bonus coins for achievement
        if (ach.rewardCoins > 0) {
          const wallet = await manager.findOne(Wallet, { where: { userId } });
          if (wallet) {
            await manager.save(Transaction, {
              walletId: wallet.id,
              transactionType: TransactionType.CREDIT,
              amount: ach.rewardCoins,
              source: TransactionSource.ACHIEVEMENT_BONUS,
              referenceId: ach.id,
            });
            wallet.balance += ach.rewardCoins;
            await manager.save(wallet);
          }
        }

        newlyEarned.push(ach.id);
      }
    }

    return newlyEarned;
  }

  /**
   * Evaluate single achievement condition.
   * Each condition_type has a specific handler.
   */
  private async evaluateCondition(
    userId: number,
    ach: Achievement,
    manager: EntityManager,
  ): Promise<boolean> {
    const { condition_type, params } = ach.config;

    switch (condition_type) {
      case 'lesson_complete': {
        const count = await manager
          .createQueryBuilder(TaskResult, 'tr')
          .innerJoin('tr.task', 't')
          .where('tr.user_id = :userId', { userId })
          .andWhere('tr.is_correct = true')
          .select('COUNT(DISTINCT t.lesson_id)', 'cnt')
          .getRawOne();
        return Number(count.cnt) >= Number(params.count ?? 1);
      }
      case 'streak_correct': {
        const last = await manager
          .createQueryBuilder(TaskResult, 'tr')
          .where('tr.user_id = :userId', { userId })
          .orderBy('tr.completed_at', 'DESC')
          .limit(Number(params.count ?? 5))
          .getMany();
        if (last.length < Number(params.count ?? 5)) return false;
        return last.every((r) => r.isCorrect);
      }
      case 'avg_score_threshold': {
        const result = await manager
          .createQueryBuilder(TaskResult, 'tr')
          .where('tr.user_id = :userId', { userId })
          .select('AVG(tr.score)', 'avg')
          .addSelect('COUNT(*)', 'cnt')
          .getRawOne();
        if (Number(result.cnt) < 10) return false;
        return Number(result.avg) >= Number(params.min_score ?? 90);
      }
      default:
        return false;
    }
  }
}
