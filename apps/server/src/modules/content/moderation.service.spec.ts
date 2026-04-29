import { ModerationService } from './moderation.service';

describe('ModerationService (436-FZ compliance)', () => {
  let service: ModerationService;
  const stopWords = new Set(['плохое', 'запрещенное', 'мат']);

  beforeEach(() => {
    service = new ModerationService(stopWords);
  });

  describe('containsForbidden', () => {
    it('returns false for empty text', () => {
      expect(service.containsForbidden('')).toBe(false);
    });

    it('returns false for clean text', () => {
      expect(service.containsForbidden('привет, как дела')).toBe(false);
    });

    it('detects forbidden word in lowercase', () => {
      expect(service.containsForbidden('это плохое слово')).toBe(true);
    });

    it('detects forbidden word in uppercase', () => {
      expect(service.containsForbidden('ПЛОХОЕ слово')).toBe(true);
    });

    it('detects forbidden word with mixed case', () => {
      expect(service.containsForbidden('ПлОхОе')).toBe(true);
    });

    it('detects homoglyph substitution (latin letters)', () => {
      // 'плохое' with latin 'o' instead of cyrillic 'о'
      expect(service.containsForbidden('плoхoе')).toBe(true);
    });

    it('detects digit substitution', () => {
      // 'плохое' with 0 instead of о
      expect(service.containsForbidden('пл0х0е')).toBe(true);
    });

    it('detects forbidden word with surrounding punctuation', () => {
      expect(service.containsForbidden('это, мат!')).toBe(true);
    });

    it('does not flag word containing forbidden substring', () => {
      // 'плохого' contains 'плохо' but is a different word
      // Strict equality check should not flag this
      expect(service.containsForbidden('плохого человека нет')).toBe(false);
    });
  });

  describe('censor', () => {
    it('replaces forbidden word with asterisks', () => {
      const result = service.censor('это плохое слово');
      expect(result).toBe('это ****** слово');
    });

    it('preserves clean text unchanged', () => {
      expect(service.censor('добрые слова')).toBe('добрые слова');
    });

    it('handles multiple forbidden words', () => {
      const result = service.censor('мат и плохое');
      expect(result).toBe('*** и ******');
    });
  });

  describe('normalize', () => {
    it('lowercases text', () => {
      expect(service.normalize('ПРИВЕТ')).toBe('привет');
    });

    it('collapses whitespace', () => {
      expect(service.normalize('hello   world')).toBe('hello world');
    });

    it('trims edges', () => {
      expect(service.normalize('  hello  ')).toBe('hello');
    });
  });
});
