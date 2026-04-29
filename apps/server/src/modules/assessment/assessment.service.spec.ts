import { AssessmentService } from './assessment.service';
import { TaskType } from '../../entities';

describe('AssessmentService', () => {
  let service: AssessmentService;

  beforeEach(() => {
    service = new AssessmentService();
  });

  describe('multiple_choice', () => {
    const config = {
      options: ['Деньги', 'Бартер', 'Кредит', 'Депозит'],
      correct_index: 0,
    };

    it('returns 100 for correct answer', () => {
      const result = service.evaluate(TaskType.MULTIPLE_CHOICE, config, {
        selected_index: 0,
      });
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(100);
    });

    it('returns 0 for wrong answer', () => {
      const result = service.evaluate(TaskType.MULTIPLE_CHOICE, config, {
        selected_index: 2,
      });
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe('matching', () => {
    const config = {
      correct_pairs: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    };

    it('returns 100 for all correct pairs', () => {
      const result = service.evaluate(TaskType.MATCHING, config, {
        pairs: [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
      });
      expect(result.score).toBe(100);
      expect(result.isCorrect).toBe(true);
    });

    it('returns partial score for partial match', () => {
      const result = service.evaluate(TaskType.MATCHING, config, {
        pairs: [
          [0, 0],
          [1, 2], // wrong
          [2, 2],
        ],
      });
      expect(result.score).toBe(67); // 2/3 = 66.67 rounded
      expect(result.isCorrect).toBe(false);
    });

    it('returns 0 for empty pairs', () => {
      const result = service.evaluate(TaskType.MATCHING, config, { pairs: [] });
      expect(result.score).toBe(0);
    });
  });

  describe('open_answer (fuzzy match)', () => {
    const config = { expected_answer: 'деньги' };

    it('accepts exact match', () => {
      const result = service.evaluate(TaskType.OPEN_ANSWER, config, {
        text: 'деньги',
      });
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(100);
    });

    it('handles whitespace and case', () => {
      const result = service.evaluate(TaskType.OPEN_ANSWER, config, {
        text: '  ДЕНЬГИ  ',
      });
      expect(result.isCorrect).toBe(true);
    });

    it('accepts close typo (1 letter)', () => {
      const result = service.evaluate(TaskType.OPEN_ANSWER, config, {
        text: 'деньго', // 1 letter off
      });
      // 5/6 = 0.833 — below 0.85 threshold
      expect(result.score).toBeGreaterThan(80);
    });

    it('rejects very different word', () => {
      const result = service.evaluate(TaskType.OPEN_ANSWER, config, {
        text: 'кошка',
      });
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('game_scenario', () => {
    it('marks correct when score >= 70', () => {
      const result = service.evaluate(
        TaskType.GAME_SCENARIO,
        { scene_id: 'cash_register' },
        { score: 85 },
      );
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(85);
    });

    it('marks incorrect when score < 70', () => {
      const result = service.evaluate(
        TaskType.GAME_SCENARIO,
        { scene_id: 'cash_register' },
        { score: 50 },
      );
      expect(result.isCorrect).toBe(false);
    });

    it('clamps to [0, 100]', () => {
      const above = service.evaluate(
        TaskType.GAME_SCENARIO,
        {},
        { score: 150 },
      );
      const below = service.evaluate(
        TaskType.GAME_SCENARIO,
        {},
        { score: -10 },
      );
      expect(above.score).toBe(100);
      expect(below.score).toBe(0);
    });
  });
});
