# Sentrygram Node.js SDK

Send alerts to your Telegram with one line of code.

## Installation

```bash
npm install sentrygram
# or
yarn add sentrygram
# or
pnpm add sentrygram
```

## Quick Start

```typescript
import { Sentrygram } from 'sentrygram';

// Initialize with your API key
const client = new Sentrygram('sk_your_api_key');

// Send a simple alert
await client.alert('Deployment completed successfully!');

// Send with severity level
await client.alert('Database connection failed', { level: 'error' });

// Send with context
await client.alert('New user signup', {
  level: 'info',
  context: { userId: 123, plan: 'pro' }
});
```

## CommonJS

```javascript
const { Sentrygram } = require('sentrygram');

const client = new Sentrygram('sk_your_api_key');
client.alert('Hello from Node.js!');
```

## Alert Levels

- `info` - Informational messages (blue)
- `warning` - Warning messages (yellow)
- `error` - Error messages (red)
- `critical` - Critical alerts (red)

## Error Handling

```typescript
import { Sentrygram, RateLimitError, NotificationsPausedError, SentrygramError } from 'sentrygram';

const client = new Sentrygram('sk_your_api_key');

try {
  await client.alert('Hello!');
} catch (e) {
  if (e instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${e.retryAfter} seconds`);
  } else if (e instanceof NotificationsPausedError) {
    console.log('Notifications paused. Reactivate at sentrygram.com');
  } else if (e instanceof SentrygramError) {
    console.log(`Error: ${e.message}`);
  }
}
```

## Configuration

```typescript
// Simple initialization
const client = new Sentrygram('sk_your_api_key');

// With custom base URL (for self-hosted or testing)
const client = new Sentrygram({
  apiKey: 'sk_your_api_key',
  baseUrl: 'https://api.your-domain.com'
});
```

## Rate Limits

- **Burst limit**: 10 alerts per minute
- **Hourly limit**: 200 alerts per hour

If you exceed the burst limit repeatedly, notifications will be automatically paused to prevent spam.

## Get Your API Key

1. Sign up at [sentrygram.com](https://sentrygram.com)
2. Link your Telegram account
3. Create an API key in the dashboard

## License

MIT
