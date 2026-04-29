import { Injectable } from '@nestjs/common';
import { TaskType } from '../../entities';

export interface AnswerEvaluation {
  isCorrect: boolean;
  score: number; // 0-100
}

/**
 * Assessment service (section 2.1, module A3).
 * Evaluates user answers based on task type and config.
 */
@Injectable()
export class AssessmentService {
  /**
   * Evaluate answer against task config.
   * Returns score in [0, 100] range.
   */
  evaluate(
    taskType: TaskType,
    config: Record<string, unknown>,
    answer: unknown,
  ): AnswerEvaluation {
    switch (taskType) {
      case TaskType.MULTIPLE_CHOICE:
        return this.evaluateMultipleChoice(config, answer);
      case TaskType.MATCHING:
        return this.evaluateMatching(config, answer);
      case TaskType.OPEN_ANSWER:
        return this.evaluateOpenAnswer(config, answer);
      case TaskType.GAME_SCENARIO:
        return this.evaluateGameScenario(config, answer);
      default:
        return { isCorrect: false, score: 0 };
    }
  }

  private evaluateMultipleChoice(
    config: Record<string, unknown>,
    answer: unknown,
  ): AnswerEvaluation {
    const correctIndex = config.correct_index as number;
    const userAnswer = (answer as { selected_index?: number })?.selected_index;
    const isCorrect = userAnswer === correctIndex;
    return { isCorrect, score: isCorrect ? 100 : 0 };
  }

  private evaluateMatching(
    config: Record<string, unknown>,
    answer: unknown,
  ): AnswerEvaluation {
    const correctPairs = config.correct_pairs as Array<[number, number]>;
    const userPairs = (answer as { pairs?: Array<[number, number]> })?.pairs ?? [];

    if (!correctPairs || correctPairs.length === 0) {
      return { isCorrect: false, score: 0 };
    }

    let matches = 0;
    for (const [a, b] of userPairs) {
      const found = correctPairs.some(([ca, cb]) => ca === a && cb === b);
      if (found) matches++;
    }

    const score = Math.round((matches / correctPairs.length) * 100);
    return { isCorrect: score === 100, score };
  }

  private evaluateOpenAnswer(
    config: Record<string, unknown>,
    answer: unknown,
  ): AnswerEvaluation {
    const expected = (config.expected_answer as string)?.toLowerCase().trim();
    const userText = ((answer as { text?: string })?.text ?? '')
      .toLowerCase()
      .trim();

    if (!expected) return { isCorrect: false, score: 0 };

    // Simple Levenshtein-based fuzzy match
    const similarity = this.stringSimilarity(expected, userText);
    const threshold = 0.85; // 85% match required
    const isCorrect = similarity >= threshold;
    return { isCorrect, score: Math.round(similarity * 100) };
  }

  private evaluateGameScenario(
    config: Record<string, unknown>,
    answer: unknown,
  ): AnswerEvaluation {
    // For game scenarios, client computes win/loss locally and sends final score
    const userScore = (answer as { score?: number })?.score ?? 0;
    const clamped = Math.max(0, Math.min(100, userScore));
    return { isCorrect: clamped >= 70, score: clamped };
  }

  /**
   * Levenshtein distance-based similarity (0..1).
   */
  private stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;

    const distance = this.levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen;
  }

  private levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      Array(n + 1).fill(0),
    );

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[m][n];
  }
}
