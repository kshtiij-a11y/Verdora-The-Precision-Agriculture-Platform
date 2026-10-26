// Retry temporary Gemini/API failures, but do not retry an exhausted daily quota.
export async function withTransientModelRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Daily quota will not recover with a short retry. Fail fast instead of
      // generating extra requests and noisy logs until the quota resets.
      const dailyQuotaExceeded =
        /GenerateRequestsPerDay|requests per day|daily quota|per day limit exceeded/i.test(message);
      if (dailyQuotaExceeded) throw error;

      const transient =
        /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|high demand|temporarily unavailable|rate limit|requests per minute/i.test(message);
      if (!transient || attempt >= maxRetries) throw error;

      const delay = 1000 * (2 ** attempt) + Math.floor(Math.random() * 250);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
