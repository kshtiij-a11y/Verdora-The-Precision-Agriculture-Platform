// src/ai/flows/translate-advisory-alerts.ts
'use server';

/**
 * @fileOverview Translates crop advisory alerts into the user's local language.
 *
 * - translateAdvisoryAlerts - A function that translates the input alert to the specified language.
 * - TranslateAdvisoryAlertsInput - The input type for the translateAdvisoryAlerts function.
 * - TranslateAdvisoryAlertsOutput - The return type for the translateAdvisoryAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateAdvisoryAlertsInputSchema = z.object({
  text: z.string().describe('The advisory alert text to translate.'),
  language: z.string().describe('The target language for translation.'),
});

export type TranslateAdvisoryAlertsInput = z.infer<typeof TranslateAdvisoryAlertsInputSchema>;

const TranslateAdvisoryAlertsOutputSchema = z.object({
  translatedText: z.string().describe('The translated advisory alert text.'),
});

export type TranslateAdvisoryAlertsOutput = z.infer<typeof TranslateAdvisoryAlertsOutputSchema>;

export async function translateAdvisoryAlerts(
  input: TranslateAdvisoryAlertsInput
): Promise<TranslateAdvisoryAlertsOutput> {
  return translateAdvisoryAlertsFlow(input);
}

const translateAdvisoryAlertsPrompt = ai.definePrompt({
  name: 'translateAdvisoryAlertsPrompt',
  input: {schema: TranslateAdvisoryAlertsInputSchema},
  output: {schema: TranslateAdvisoryAlertsOutputSchema},
  prompt: `Translate the following text to {{{language}}}.\n\nText: {{{text}}}`,
});

const translateAdvisoryAlertsFlow = ai.defineFlow(
  {
    name: 'translateAdvisoryAlertsFlow',
    inputSchema: TranslateAdvisoryAlertsInputSchema,
    outputSchema: TranslateAdvisoryAlertsOutputSchema,
  },
  async input => {
    const {output} = await translateAdvisoryAlertsPrompt(input, { model: 'googleai/gemini-2.5-flash' });
    return output!;
  }
);
