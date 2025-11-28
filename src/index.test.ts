// ABOUTME: Tests for the Sentrygram Node.js SDK.
// ABOUTME: Tests client initialization and alert sending.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sentrygram, RateLimitError, NotificationsPausedError, SentrygramError } from './index';

describe('Sentrygram', () => {
  describe('constructor', () => {
    it('requires an API key', () => {
      expect(() => new Sentrygram('')).toThrow('API key is required');
    });

    it('sets default base URL', () => {
      const client = new Sentrygram('sk_test123');
      expect(client['baseUrl']).toBe('https://api.sentrygram.com');
    });

    it('accepts custom base URL', () => {
      const client = new Sentrygram({ apiKey: 'sk_test123', baseUrl: 'https://custom.example.com/' });
      expect(client['baseUrl']).toBe('https://custom.example.com');
    });

    it('accepts string config', () => {
      const client = new Sentrygram('sk_test123');
      expect(client['apiKey']).toBe('sk_test123');
    });

    it('accepts object config', () => {
      const client = new Sentrygram({ apiKey: 'sk_test456' });
      expect(client['apiKey']).toBe('sk_test456');
    });
  });

  describe('alert', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('sends simple alert', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new Sentrygram('sk_test123');
      const result = await client.alert('Test message');

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sentrygram.com/v1/alert',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ message: 'Test message' }),
        })
      );
    });

    it('sends alert with level', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const client = new Sentrygram('sk_test123');
      await client.alert('Error occurred', { level: 'error' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ message: 'Error occurred', level: 'error' }),
        })
      );
    });

    it('sends alert with context', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const client = new Sentrygram('sk_test123');
      await client.alert('User signup', { context: { userId: 123, email: 'test@example.com' } });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'User signup',
            context: { userId: 123, email: 'test@example.com' },
          }),
        })
      );
    });

    it('throws RateLimitError on 429', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ detail: { error: 'rate_limit', retry_after: 30 } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new Sentrygram('sk_test123');
      await expect(client.alert('Test')).rejects.toThrow(RateLimitError);

      try {
        await client.alert('Test');
      } catch (e) {
        expect((e as RateLimitError).retryAfter).toBe(30);
      }
    });

    it('throws NotificationsPausedError when paused', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ detail: { error: 'notifications_paused' } }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new Sentrygram('sk_test123');
      await expect(client.alert('Test')).rejects.toThrow(NotificationsPausedError);
    });

    it('throws SentrygramError on invalid API key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      vi.stubGlobal('fetch', mockFetch);

      const client = new Sentrygram('sk_invalid');
      await expect(client.alert('Test')).rejects.toThrow('Invalid API key');
    });
  });
});
