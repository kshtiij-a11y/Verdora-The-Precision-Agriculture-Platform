
'use server';
/**
 * @fileOverview Suggests crops suitable for a given location.
 *
 * - suggestCrops - A function that suggests crops.
 * - SuggestCropsInput - The input type for the suggestCrops function.
 * - SuggestCropsOutput - The return type for the suggestCrops function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCropsInputSchema = z.object({
  location: z.string().trim().min(2, 'Please provide a valid district or location.').max(120, 'Location is too long.').describe('The district or general location in India to suggest crops for.'),
});
export type SuggestCropsInput = z.infer<typeof SuggestCropsInputSchema>;

const SuggestCropsOutputSchema = z.object({
  suggestedCrops: z.array(z.string().trim().min(1)).min(5).max(10).describe('A list of 5-10 crop names suitable for the given location.'),
});
export type SuggestCropsOutput = z.infer<typeof SuggestCropsOutputSchema>;

export async function suggestCrops(input: SuggestCropsInput): Promise<SuggestCropsOutput> {
  return suggestCropsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCropsPrompt',
  input: {schema: SuggestCropsInputSchema},
  output: {schema: SuggestCropsOutputSchema},
  prompt: `You are an expert agricultural advisor for India. Based on the provided location (district), suggest a list of 5 to 10 crops that are commonly and successfully grown there.

Your response MUST only contain the list of crop names.

Location: {{{location}}}`,
});

const suggestCropsFlow = ai.defineFlow(
  {
    name: 'suggestCropsFlow',
    inputSchema: SuggestCropsInputSchema,
    outputSchema: SuggestCropsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || output.suggestedCrops.length < 5) {
      throw new Error('The crop recommendation model returned an incomplete result.');
    }
    return {
      suggestedCrops: [...new Set(output.suggestedCrops.map(crop => crop.trim()))].slice(0, 10),
    };
  }
);
