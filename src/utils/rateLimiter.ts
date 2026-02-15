/**
 * Client-side rate limiter to prevent exceeding Firestore free tier limits.
 *
 * Firestore free tier (per day):
 *   - 50,000 document reads
 *   - 20,000 document writes
 *   - 20,000 document deletes
 *
 * This limiter enforces per-minute and per-day caps well below these limits
 * to guard against accidental or malicious abuse.
 */

interface RateLimitConfig {
  /** Max operations allowed in the time window */
  maxOperations: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional daily cap */
  dailyCap?: number;
}

interface RateLimitState {
  timestamps: number[];
  dailyCount: number;
  dailyResetDate: string;
}

const STORAGE_KEY_PREFIX = 'recept-samlaren-ratelimit-';

class RateLimiter {
  private config: RateLimitConfig;
  private name: string;
  private state: RateLimitState;

  constructor(name: string, config: RateLimitConfig) {
    this.name = name;
    this.config = config;
    this.state = this.loadState();
  }

  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.name}`;
  }

  private loadState(): RateLimitState {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored) as RateLimitState;
        // Reset daily count if it's a new day
        const today = new Date().toISOString().slice(0, 10);
        if (parsed.dailyResetDate !== today) {
          parsed.dailyCount = 0;
          parsed.dailyResetDate = today;
        }
        return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return {
      timestamps: [],
      dailyCount: 0,
      dailyResetDate: new Date().toISOString().slice(0, 10),
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.state));
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  /**
   * Check if an operation is allowed under the current rate limits.
   * Returns true if allowed, false if rate limited.
   */
  canProceed(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up old timestamps outside the window
    this.state.timestamps = this.state.timestamps.filter((t) => t > windowStart);

    // Check daily cap
    const today = new Date().toISOString().slice(0, 10);
    if (this.state.dailyResetDate !== today) {
      this.state.dailyCount = 0;
      this.state.dailyResetDate = today;
    }

    if (this.config.dailyCap && this.state.dailyCount >= this.config.dailyCap) {
      return false;
    }

    // Check window limit
    return this.state.timestamps.length < this.config.maxOperations;
  }

  /**
   * Record a successful operation.
   */
  record(): void {
    this.state.timestamps.push(Date.now());
    this.state.dailyCount++;
    this.saveState();
  }

  /**
   * Attempt to perform an operation. Throws if rate limited.
   */
  check(): void {
    if (!this.canProceed()) {
      const isDaily =
        this.config.dailyCap !== undefined && this.state.dailyCount >= this.config.dailyCap;

      if (isDaily) {
        throw new RateLimitError(
          `Daglig gräns nådd för ${this.name}. Försök igen imorgon.`,
          'daily'
        );
      }

      throw new RateLimitError(
        `För många förfrågningar. Vänta en stund innan du försöker igen.`,
        'window'
      );
    }
  }
}

export class RateLimitError extends Error {
  public readonly type: 'window' | 'daily';

  constructor(message: string, type: 'window' | 'daily') {
    super(message);
    this.name = 'RateLimitError';
    this.type = type;
  }
}

// --- Rate limiter instances for Firestore operations ---

// Reads: max 30 per minute, 10,000 per day (well below 50k free tier)
export const readLimiter = new RateLimiter('reads', {
  maxOperations: 30,
  windowMs: 60_000,
  dailyCap: 10_000,
});

// Writes (create + update): max 10 per minute, 5,000 per day (well below 20k free tier)
export const writeLimiter = new RateLimiter('writes', {
  maxOperations: 10,
  windowMs: 60_000,
  dailyCap: 5_000,
});

// Deletes: max 5 per minute, 2,000 per day (well below 20k free tier)
export const deleteLimiter = new RateLimiter('deletes', {
  maxOperations: 5,
  windowMs: 60_000,
  dailyCap: 2_000,
});
