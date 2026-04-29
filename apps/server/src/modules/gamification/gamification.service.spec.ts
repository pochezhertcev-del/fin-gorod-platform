import { GamificationService, DIFFICULTY_MULTIPLIERS } from './gamification.service';

/**
 * Unit tests for reward calculation formula (section 2.3 of thesis).
 * Formula: R = ⌈(score / 100) × reward_coins × difficulty_multiplier × golden_multiplier⌉
 *
 * These tests do NOT require database — they verify pure logic.
 */
describe('GamificationService.calculateReward', () => {
  let service: GamificationService;

  beforeEach(() => {
    // Pure logic tests — DataSource not needed
    service = new GamificationService(null as never);
  });

  describe('boundary conditions', () => {
    it('returns 0 for score=0', () => {
      expect(service.calculateReward(0, 50, 5, true)).toBe(0);
    });

    it('returns 0 for negative score', () => {
      expect(service.calculateReward(-10, 50, 1, false)).toBe(0);
    });

    it('caps score at 100', () => {
      // Even if score>100 is passed, result equals score=100
      const r1 = service.calculateReward(150, 30, 1, false);
      const r2 = service.calculateReward(100, 30, 1, false);
      expect(r1).toBe(r2);
    });
  });

  describe('full score (100), no golden bonus', () => {
    it('level 1: returns base reward', () => {
      // ceil(100/100 * 30 * 1.0 * 1) = 30
      expect(service.calculateReward(100, 30, 1, false)).toBe(30);
    });

    it('level 3: applies 1.5x multiplier', () => {
      // ceil(100/100 * 30 * 1.5 * 1) = 45
      expect(service.calculateReward(100, 30, 3, false)).toBe(45);
    });

    it('level 5: applies 2.5x multiplier', () => {
      // ceil(100/100 * 20 * 2.5 * 1) = 50
      expect(service.calculateReward(100, 20, 5, false)).toBe(50);
    });
  });

  describe('partial score', () => {
    it('score=70, level=3, no golden: rounds up to 32', () => {
      // ceil(70/100 * 30 * 1.5 * 1) = ceil(31.5) = 32
      expect(service.calculateReward(70, 30, 3, false)).toBe(32);
    });

    it('score=50, level=2, no golden', () => {
      // ceil(50/100 * 40 * 1.2 * 1) = ceil(24) = 24
      expect(service.calculateReward(50, 40, 2, false)).toBe(24);
    });

    it('score=85, level=4, no golden', () => {
      // ceil(85/100 * 25 * 1.8 * 1) = ceil(38.25) = 39
      expect(service.calculateReward(85, 25, 4, false)).toBe(39);
    });
  });

  describe('golden bonus (variable-ratio reinforcement)', () => {
    it('doubles the reward', () => {
      const noGold = service.calculateReward(70, 30, 3, false); // 32
      const withGold = service.calculateReward(70, 30, 3, true); // 63
      // Golden multiplier applied before ceiling — verify mathematical correctness
      // ceil(70/100 * 30 * 1.5 * 2) = ceil(63) = 63
      expect(noGold).toBe(32);
      expect(withGold).toBe(63);
    });

    it('full score with golden at level 5', () => {
      // ceil(100/100 * 20 * 2.5 * 2) = 100
      expect(service.calculateReward(100, 20, 5, true)).toBe(100);
    });
  });

  describe('difficulty multipliers match specification (table 2.13)', () => {
    it('level 1 multiplier is 1.0', () => {
      expect(DIFFICULTY_MULTIPLIERS[1]).toBe(1.0);
    });
    it('level 2 multiplier is 1.2', () => {
      expect(DIFFICULTY_MULTIPLIERS[2]).toBe(1.2);
    });
    it('level 3 multiplier is 1.5', () => {
      expect(DIFFICULTY_MULTIPLIERS[3]).toBe(1.5);
    });
    it('level 4 multiplier is 1.8', () => {
      expect(DIFFICULTY_MULTIPLIERS[4]).toBe(1.8);
    });
    it('level 5 multiplier is 2.5', () => {
      expect(DIFFICULTY_MULTIPLIERS[5]).toBe(2.5);
    });
  });

  describe('unknown difficulty defaults to 1.0', () => {
    it('handles invalid level gracefully', () => {
      // ceil(100/100 * 30 * 1.0 * 1) = 30
      expect(service.calculateReward(100, 30, 99, false)).toBe(30);
    });
  });
});

/**
 * Statistical test for golden bonus probability.
 * Verifies that probability is approximately 15% (section 2.3).
 */
describe('GamificationService.rollGoldenBonus', () => {
  let service: GamificationService;

  beforeEach(() => {
    service = new GamificationService(null as never);
  });

  it('returns approximately 15% true rate over 10000 iterations', () => {
    const iterations = 10000;
    let goldCount = 0;

    for (let i = 0; i < iterations; i++) {
      if (service.rollGoldenBonus()) goldCount++;
    }

    const rate = goldCount / iterations;
    // Allow ±2% tolerance for cryptographic RNG variance
    expect(rate).toBeGreaterThan(0.13);
    expect(rate).toBeLessThan(0.17);
  });

  it('returns boolean type', () => {
    const result = service.rollGoldenBonus();
    expect(typeof result).toBe('boolean');
  });
});
