// ABOUTME: Sentrygram Node.js/TypeScript SDK - send alerts to your Telegram.
// ABOUTME: Simple client for the Sentrygram API with full TypeScript support.

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AlertOptions {
  level?: AlertLevel;
  context?: Record<string, unknown>;
}

export class SentrygramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SentrygramError';
  }
}

export class RateLimitError extends SentrygramError {
  retryAfter?: number;

  constructor(retryAfter?: number) {
    super(retryAfter ? `Rate limited. Retry after ${retryAfter} seconds.` : 'Rate limited.');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NotificationsPausedError extends SentrygramError {
  constructor() {
    super('Notifications are paused. Reactivate at sentrygram.com');
    this.name = 'NotificationsPausedError';
  }
}

export interface SentrygramConfig {
  apiKey: string;
  baseUrl?: string;
}

export class Sentrygram {
  private apiKey: string;
  private baseUrl: string;

  static DEFAULT_BASE_URL = 'https://api.sentrygram.com';

  constructor(apiKeyOrConfig: string | SentrygramConfig) {
    if (typeof apiKeyOrConfig === 'string') {
      this.apiKey = apiKeyOrConfig;
      this.baseUrl = Sentrygram.DEFAULT_BASE_URL;
    } else {
      this.apiKey = apiKeyOrConfig.apiKey;
      this.baseUrl = (apiKeyOrConfig.baseUrl || Sentrygram.DEFAULT_BASE_URL).replace(/\/$/, '');
    }

    if (!this.apiKey) {
      throw new Error('API key is required');
    }
  }

  async alert(message: string, options?: AlertOptions): Promise<boolean> {
    const payload: Record<string, unknown> = { message };

    if (options?.level) {
      payload.level = options.level;
    }

    if (options?.context) {
      payload.context = options.context;
    }

    const response = await fetch(`${this.baseUrl}/v1/alert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return true;
    }

    if (response.status === 429) {
      try {
        const data = await response.json() as { detail?: { error?: string; retry_after?: number } };
        const detail = data.detail;
        if (detail?.error === 'notifications_paused') {
          throw new NotificationsPausedError();
        }
        throw new RateLimitError(detail?.retry_after);
      } catch (e) {
        if (e instanceof NotificationsPausedError || e instanceof RateLimitError) {
          throw e;
        }
        throw new RateLimitError();
      }
    }

    if (response.status === 401) {
      throw new SentrygramError('Invalid API key');
    }

    if (response.status === 400) {
      try {
        const data = await response.json() as { detail?: { error?: string } };
        if (data.detail?.error === 'telegram_not_linked') {
          throw new SentrygramError('Telegram not linked. Visit sentrygram.com to link your account.');
        }
      } catch (e) {
        if (e instanceof SentrygramError) throw e;
      }
      throw new SentrygramError(`Bad request: ${await response.text()}`);
    }

    throw new SentrygramError(`API error (${response.status}): ${await response.text()}`);
  }
}

export default Sentrygram;
