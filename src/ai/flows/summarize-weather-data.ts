'use server';
/**
 * @fileOverview Summarizes weather data for farmers.
 *
 * - summarizeWeatherData - A function that summarizes weather data.
 * - SummarizeWeatherDataInput - The input type for the summarizeWeatherData function.
 * - SummarizeWeatherDataOutput - The return type for the summarizeWeatherData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWeatherDataInputSchema = z.object({
  location: z.string().describe('The location for the weather forecast.'),
  weatherData: z.string().describe('The raw weather data from the API.'),
});
export type SummarizeWeatherDataInput = z.infer<typeof SummarizeWeatherDataInputSchema>;

const SummarizeWeatherDataOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the weather forecast, focused on actionable advice for a farmer.'),
});
export type SummarizeWeatherDataOutput = z.infer<typeof SummarizeWeatherDataOutputSchema>;

export async function summarizeWeatherData(input: SummarizeWeatherDataInput): Promise<SummarizeWeatherDataOutput> {
  return summarizeWeatherDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWeatherDataPrompt',
  input: {schema: SummarizeWeatherDataInputSchema},
  output: {schema: SummarizeWeatherDataOutputSchema},
  prompt: `You are an expert farm advisor analyzing raw weather data for a farmer in {{{location}}}. Your task is to provide actionable insights, not a weather report.

**Strict Instructions:**
1.  **Synthesize, Do Not Repeat:** You MUST NOT simply list the raw data. Your job is to analyze and synthesize it into a coherent, actionable summary.
2.  **Prioritize Critical Information:** Start with the most important forecast for the next 48 hours. Is there heavy rain, a heatwave, or high winds approaching? This MUST be the first sentence.
3.  **Focus on Farming Impact:** Mention precipitation chance (only if > 50%), significant temperature shifts, and high wind speeds. Explain what this means for a farmer (e.g., "High winds may damage young crops," or "Upcoming rain means you can delay irrigation.").
4.  **Be Concise:** The entire summary MUST be two to three sentences maximum.

Raw Weather Data:
\`\`\`json
{{{weatherData}}}
\`\`\``,
});

const summarizeWeatherDataFlow = ai.defineFlow(
  {
    name: 'summarizeWeatherDataFlow',
    inputSchema: SummarizeWeatherDataInputSchema,
    outputSchema: SummarizeWeatherDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
