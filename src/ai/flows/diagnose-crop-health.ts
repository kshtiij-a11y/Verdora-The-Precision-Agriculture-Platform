'use server';
/**
 * @fileOverview An AI agent for diagnosing crop health from an image.
 *
 * - diagnoseCropHealth - A function that handles the crop diagnosis process.
 * - DiagnoseCropHealthInput - The input type for the diagnoseCropHealth function.
 * - DiagnoseCropHealthOutput - The return type for the diagnoseCropHealth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseCropHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.",
    ),
});
export type DiagnoseCropHealthInput = z.infer<typeof DiagnoseCropHealthInputSchema>;

const DiagnoseCropHealthOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the image appears to contain a plant.'),
    commonName: z.string().describe('The common name of the identified plant.'),
    latinName: z.string().describe('The Latin name of the identified plant.'),
  }),
  diagnosis: z.object({
    isHealthy: z.boolean().describe('A boolean indicating if the plant appears to be healthy.'),
    diagnosis: z.string().describe("A detailed diagnosis of the plant's health, including any identified diseases, pests, or deficiencies, along with recommended actions. If image quality is poor, state that first."),
  }),
});
export type DiagnoseCropHealthOutput = z.infer<typeof DiagnoseCropHealthOutputSchema>;

export async function diagnoseCropHealth(input: DiagnoseCropHealthInput): Promise<DiagnoseCropHealthOutput> {
  return diagnoseCropHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropHealthPrompt',
  input: {schema: DiagnoseCropHealthInputSchema},
  output: {schema: DiagnoseCropHealthOutputSchema},
  prompt: `You are an expert plant pathologist. Your task is to perform a rigorous, step-by-step diagnosis of a plant from an image. Your analysis MUST be based exclusively on the knowledge contained within the "New Plant Diseases Dataset" from Kaggle. Do not use any external knowledge.

**Verification Steps:**
1.  **Assess Image Quality:** First, you MUST evaluate the image quality. If it is blurry, dark, poorly lit, or too distant for a high-confidence diagnosis, you MUST state this first in your diagnosis. For example: "Image quality is too poor for an accurate diagnosis."
2.  **Identify the Plant:** If the image is clear, identify the plant. If the image does not appear to contain a plant, set 'isPlant' to false and stop.
3.  **Perform Diagnosis:** Compare the visual evidence in the photo ONLY to the classes within the Kaggle dataset (e.g., "Tomato___Bacterial_spot", "Corn_(maize)___healthy").
    - If the plant appears healthy according to the dataset, state this clearly and set 'isHealthy' to true.
    - If signs of disease are present that match a dataset class, you MUST name the specific disease and suggest a standard, actionable treatment for a farmer.
    - **Crucially:** If you are not at least 95% confident in a diagnosis, you MUST NOT guess. In such cases, state that a confident diagnosis cannot be made from the image and suggest taking a clearer picture from a different angle.

Your output MUST be in the specified JSON format. Failure to follow these steps is not an option.

Photo: {{media url=photoDataUri}}`,
});

const diagnoseCropHealthFlow = ai.defineFlow(
  {
    name: 'diagnoseCropHealthFlow',
    inputSchema: DiagnoseCropHealthInputSchema,
    outputSchema: DiagnoseCropHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
    return output!;
  }
);
