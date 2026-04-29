import { Injectable } from '@nestjs/common';

/**
 * Content moderation service (section 1.4, NFR-12).
 * Implements automated stop-word filtering per Federal Law 436-FZ.
 *
 * In production: stop-words loaded from DB (table stop_words, 2400+ entries).
 * Here: minimal demo dictionary for testing.
 */

const DEMO_STOP_WORDS = new Set([
  'мат1',
  'мат2',
  'мат3',
  // ... in real code: loaded from DB
]);

// Common letter substitutions used to bypass filters
const HOMOGLYPHS: Record<string, string> = {
  '0': 'о',
  '3': 'з',
  '4': 'ч',
  '6': 'б',
  '@': 'а',
  'a': 'а',
  'e': 'е',
  'o': 'о',
  'p': 'р',
  'c': 'с',
  'x': 'х',
  'y': 'у',
};

@Injectable()
export class ModerationService {
  private stopWords: Set<string>;

  constructor(stopWords?: Set<string>) {
    this.stopWords = stopWords ?? DEMO_STOP_WORDS;
  }

  /**
   * Normalize text for comparison:
   * - lowercase
   * - replace homoglyphs
   * - remove extra whitespace
   */
  normalize(text: string): string {
    let normalized = text.toLowerCase();
    for (const [from, to] of Object.entries(HOMOGLYPHS)) {
      normalized = normalized.replaceAll(from, to);
    }
    return normalized.replace(/\s+/g, ' ').trim();
  }

  /**
   * Check if text contains any stop word.
   * Returns true if text is forbidden.
   */
  containsForbidden(text: string): boolean {
    if (!text) return false;
    const normalized = this.normalize(text);
    const words = normalized.split(/\s+/);

    for (const word of words) {
      // Strip punctuation
      const clean = word.replace(/[^a-zа-я0-9]/gi, '');
      if (this.stopWords.has(clean)) return true;
    }

    return false;
  }

  /**
   * Replace forbidden words with asterisks.
   */
  censor(text: string): string {
    if (!text) return text;
    const words = text.split(/(\s+)/);
    return words
      .map((part) => {
        if (/^\s+$/.test(part)) return part;
        const normalized = this.normalize(part);
        const clean = normalized.replace(/[^a-zа-я0-9]/gi, '');
        if (this.stopWords.has(clean)) return '*'.repeat(part.length);
        return part;
      })
      .join('');
  }
}
