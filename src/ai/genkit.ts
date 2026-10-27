
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
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
