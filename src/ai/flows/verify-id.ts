
'use server';
/**
 * @fileOverview An AI agent for verifying a government ID from an image.
 *
 * - verifyId - A function that handles the ID verification process.
 * - VerifyIdInput - The input type for the verifyId function.
 * - VerifyIdOutput - The return type for the verifyId function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyIdInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo or PDF of a government-issued ID, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyIdInput = z.infer<typeof VerifyIdInputSchema>;

const VerifyIdOutputSchema = z.object({
  isIdCard: z.boolean().describe('A boolean indicating if the image appears to be a valid government-issued ID card.'),
  reason: z.string().describe('A brief reason for the verification decision. E.g., "Verified as a valid ID card." or "The image does not appear to be a government ID."'),
  extractedName: z.string().optional().describe('The name of the person extracted from the ID card, if visible.'),
  idType: z.enum(["Aadhar", "PAN", "Ration Card", "Gas Connection", "Other", "Unknown"]).optional().describe("The specific type of ID card identified."),
  idNumber: z.string().optional().describe("The ID number extracted from the card, if visible."),
  confidenceScore: z.number().optional().describe("A confidence score from 0.0 to 1.0 indicating the likelihood that the document is a valid, authentic ID.")
});
export type VerifyIdOutput = z.infer<typeof VerifyIdOutputSchema>;

export async function verifyId(input: VerifyIdInput): Promise<VerifyIdOutput> {
  return verifyIdFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyIdPrompt',
  input: {schema: VerifyIdInputSchema},
  output: {schema: VerifyIdOutputSchema},
  prompt: `You are an AI performing strict, high-stakes verification of Indian government-issued identification. Your ONLY goal is to determine authenticity with extreme prejudice. Assume any deviation from official standards is a forgery.

You are ONLY permitted to accept these document types:
- Aadhar Card
- PAN Card
- Ration Card
- Gas Connection Document

**Strict Verification Protocol:**
1.  **Document Type Check:** First, determine if the document is one of the accepted types. If not, you MUST immediately reject it, set 'isIdCard' to false, and provide the reason "Unsupported document type."
2.  **Forgery Detection:** Scrutinize the document for any signs of forgery. You MUST look for:
    -   Incorrect or poorly rendered Government of India emblems (e.g., Ashoka Lion Capital).
    -   Missing or fake-looking holograms, ghost images, or guilloché patterns.
    -   Inconsistent fonts, pixelation around text, or misaligned text fields.
    -   Any signs of digital manipulation or alteration.
    If ANY of these signs are present, you MUST reject the document, set 'isIdCard' to false, and state "Signs of potential forgery detected."
3.  **Image Quality Check:** The image MUST be perfectly clear and legible. You MUST reject any document that is blurry, has significant glare, is poorly cropped, or is otherwise unreadable. Set 'isIdCard' to false with the reason "Poor image quality."
4.  **Final Decision:**
    -   **Approve:** Only if the document is an accepted type, perfectly clear, and shows ZERO signs of forgery, set 'isIdCard' to true. Set a confidenceScore > 0.9. Extract the full name, ID type, and ID number.
    -   **Reject:** For all other cases, set 'isIdCard' to false. Provide a clear reason for rejection and set a confidenceScore < 0.3.

Do not be lenient. Your output MUST be in the specified JSON format.

Document: {{media url=photoDataUri}}`,
});

const verifyIdFlow = ai.defineFlow(
  {
    name: 'verifyIdFlow',
    inputSchema: VerifyIdInputSchema,
    outputSchema: VerifyIdOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, { model: 'googleai/gemini-2.5-flash' });
    return output!;
  }
);
