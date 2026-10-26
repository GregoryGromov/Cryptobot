import pino from 'pino';
export const logger = pino({
  base: { service: 'reinforce' },
  redact: {
    paths: [
      'authorization',
      'cookie',
      'token',
      'secret',
      'password',
      'prompt',
      'messages',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[redacted]',
  },
});
