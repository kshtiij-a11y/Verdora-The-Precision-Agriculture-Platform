// Retry transient Gemini/API failures without depending on provider middleware exports.
export async function withTransientModelRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxRetries = 3;
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const transient = /\b(429|500|502|503|504)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|high demand|temporarily unavailable/i.test(message);
      if (!transient || attempt >= maxRetries) throw error;
      const delay = 1000 * (2 ** attempt) + Math.floor(Math.random() * 250);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
