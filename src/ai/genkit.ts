
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';
import { geminiApiKey } from '@/config';

config(); // Load environment variables from .env file

if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY environment variable not set.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: geminiApiKey,
      generate: {
        retry: {
          // Retry only temporary 503 errors; quota errors will not be fixed by retrying
          on: (err: any) => {
            const message = err.message || '';
            return message.includes('503') || message.includes('Service Unavailable');
          },
        },
      },
    }),
  ],
  model: 'googleai/gemini-3.8-flash',
});
