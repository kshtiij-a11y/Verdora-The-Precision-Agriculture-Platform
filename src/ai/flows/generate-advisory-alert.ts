'use server';
/**
 * @fileOverview Generates a crop advisory alert for a specific location and crop.
 *
 * - generateAdvisoryAlert - A function that generates an advisory alert.
 * - GenerateAdvisoryAlertInput - The input type for the generateAdvisoryAlert function.
 * - GenerateAdvisoryAlertOutput - The return type for the generateAdvisoryAlert function.
 */

import {ai} from '@/ai/genkit';
import { getAgricultureNews } from '@/ai/tools/agri-tools';
import {z} from 'genkit';

const GenerateAdvisoryAlertInputSchema = z.object({
  location: z.string().describe('The location for the advisory alert. This should include enough detail to infer the country.'),
  crop: z.string().describe('The primary crop for the advisory alert.'),
});
export type GenerateAdvisoryAlertInput = z.infer<typeof GenerateAdvisoryAlertInputSchema>;

const GenerateAdvisoryAlertOutputSchema = z.object({
  alert: z.string().describe('A concise and actionable advisory alert for a farmer.'),
});
export type GenerateAdvisoryAlertOutput = z.infer<typeof GenerateAdvisoryAlertOutputSchema>;

export async function generateAdvisoryAlert(input: GenerateAdvisoryAlertInput): Promise<GenerateAdvisoryAlertOutput> {
  return generateAdvisoryAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAdvisoryAlertPrompt',
  tools: [getAgricultureNews],
  input: {schema: GenerateAdvisoryAlertInputSchema},
  output: {schema: GenerateAdvisoryAlertOutputSchema},
  prompt: `You are an agricultural expert creating a critical alert for a farmer. Your goal is maximum relevance and actionability.

**Strict Instructions:**
1.  **Tool First:** You MUST first use the 'getAgricultureNews' tool to find recent news for the specified location. Use 'in' (India) as the default country code if not specified.
2.  **Generate a Plausible Alert:** Based on the news (if any) or general knowledge of common agricultural issues, generate a concise alert. The alert MUST focus on a single, plausible, and timely threat (e.g., a specific pest like 'Fall Armyworm', a disease like 'Powdery Mildew', or an impending weather event).
3.  **NO GENERIC ADVICE:** You are strictly forbidden from giving vague advice like "monitor for pests" or "check irrigation". You MUST name a specific, actionable threat and a corresponding, immediate action a farmer can take. For example: "Fall Armyworm detected in your region. Scout your corn fields immediately and apply Emamectin Benzoate if found."

Do not include any preamble, greeting, or text other than the alert itself. Your response must be only the alert.

Location: {{{location}}}
Primary Crop: {{{crop}}}`,
});

const generateAdvisoryAlertFlow = ai.defineFlow(
  {
    name: 'generateAdvisoryAlertFlow',
    inputSchema: GenerateAdvisoryAlertInputSchema,
    outputSchema: GenerateAdvisoryAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
