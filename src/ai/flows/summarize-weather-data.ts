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
    try {
      const { output } = await prompt(input);
      if (output?.summary) return output;
    } catch (error) {
      // Keep the weather feature useful when Gemini is temporarily unavailable.
      console.error('Gemini weather summary failed; using rule-based fallback:', error);
    }

    let data: any;
    try {
      data = JSON.parse(input.weatherData);
    } catch {
      return { summary: `Weather data for ${input.location} was retrieved, but the AI summary service is temporarily unavailable. Please try again shortly.` };
    }

    const points = Array.isArray(data.forecast) ? data.forecast.slice(0, 16) : [];
    if (!points.length) {
      return { summary: `The AI summary service is temporarily unavailable for ${input.location}. Please try again shortly.` };
    }

    const descriptions = [...new Set(points.slice(0, 8).map((p: any) => String(p.weather || '').trim()).filter(Boolean))];
    const temperatures = points.slice(0, 8).map((p: any) => Number.parseFloat(String(p.temp || '').replace('°C', ''))).filter(Number.isFinite);
    const winds = points.slice(0, 8).map((p: any) => Number.parseFloat(String(p.wind_speed || '').replace('m/s', ''))).filter(Number.isFinite);
    const maxTemp = temperatures.length ? Math.max(...temperatures) : null;
    const minTemp = temperatures.length ? Math.min(...temperatures) : null;
    const maxWind = winds.length ? Math.max(...winds) : null;

    const conditions = descriptions.length ? descriptions.join(', ') : 'conditions unavailable';
    const temperatureAdvice = maxTemp !== null && maxTemp >= 35
      ? 'High temperatures may stress crops; check soil moisture and irrigate when needed.'
      : minTemp !== null && minTemp <= 10
        ? 'Cool conditions are expected; monitor sensitive crops.'
        : 'Check soil moisture before scheduling irrigation.';
    const windAdvice = maxWind !== null && maxWind >= 8
      ? 'Strong winds may damage young plants, so secure supports where needed.'
      : '';
    const temperatureRange = minTemp !== null && maxTemp !== null ? ` Temperatures are around ${Math.round(minTemp)}–${Math.round(maxTemp)}°C.` : '';

    return {
      summary: `Forecast for ${input.location}: ${conditions} over the next forecast periods.${temperatureRange} ${temperatureAdvice} ${windAdvice}`.trim(),
    };
  }
);
