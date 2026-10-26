import {retry} from 'genkit/model/middleware';

// Retry transient provider failures such as 503 UNAVAILABLE with backoff.
export const retryTransientModelErrors = retry({
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffFactor: 2,
});
