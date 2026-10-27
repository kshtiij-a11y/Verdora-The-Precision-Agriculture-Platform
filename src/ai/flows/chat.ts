
'use server';
/**
 * @fileOverview A simple chat AI agent for farmers.
 *
 * - chat - A function that handles the chat process.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import { getWeatherSummary, getMarketPrices, getAgricultureNews } from '@/ai/tools/agri-tools';
import {z} from 'zod';

const ChatInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({text: z.string()})),
    })
  ),
  prompt: z.string(),
  imageDataUri: z.string().optional().describe(
    "An optional image file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export type ChatOutput = string;

const systemPrompt = `You are an AI assistant for farmers. Your personality is helpful, knowledgeable, and professional. Your ONLY purpose is to assist with farming-related queries.

You MUST adhere to the following rules strictly:
1.  **Tool-First Approach:** Before answering, you MUST determine if a tool can answer the user's query.
    -   For weather questions, ALWAYS use the 'getWeatherSummary' tool.
    -   For crop market prices, ALWAYS use the 'getMarketPrices' tool. You will receive structured data; format it into a user-friendly string.
    -   For farming news, ALWAYS use the 'getAgricultureNews' tool.
    -   For other agriculture questions, use only the available weather, market-price, and agriculture-news tools when relevant. If they do not provide reliable relevant information, reply with the uncertainty message below.
2.  **CITE YOUR SOURCES:** Every piece of information you provide MUST be attributed to its source (e.g., "Source: Weather API", "Source: Trusted Search", "Source: App Market Dataset").
3.  **Structured Responses:** Structure your advice clearly for the farmer:
    -   **Issue:** Briefly state the problem.
    -   **Recommended Action:** Provide a clear, actionable solution.
    -   **Source:** Cite the source of your information.
4.  **Handle Uncertainty:** If the tools return no relevant data or you cannot find reliable information from trusted search, you MUST respond ONLY with: "I couldn’t find reliable information on that." Do NOT invent, guess, or use your general knowledge.
5.  **Language:** Always respond in the same language the user is using.
6.  **DO NOT ENGAGE IN:**
    -   Off-topic conversations (e.g., small talk, personal opinions, philosophy).
    -   Providing medical, financial, or legal advice. If asked, you MUST refuse and state that you are only for farming assistance.
    -   Answering questions unrelated to agriculture. If the user asks about something else, you MUST steer the conversation back to farming or state that you cannot help with that topic.

Your primary goal is accuracy and farmer safety. Failure to follow these rules is not an option.`;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const {history, prompt, imageDataUri} = input;

  const promptParts: ({text: string; media?: never} | {text?: never; media: {url: string}})[] = [{text: prompt}];
  if (imageDataUri) {
    promptParts.push({media: {url: imageDataUri}});
  }

  let response;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      response = await ai.generate({
        model: 'googleai/gemini-3.8-flash',
        tools: [getWeatherSummary, getMarketPrices, getAgricultureNews],
        prompt: [
          {text: `System instructions:\n${systemPrompt}`},
          ...history.flatMap(message =>
            message.content.map(part => ({
              text: `${message.role === 'user' ? 'Farmer' : 'Assistant'}: ${part.text}`,
            }))
          ),
          ...promptParts,
        ],
      });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTemporaryServerError = message.includes('503') || message.includes('Service Unavailable');
      if (!isTemporaryServerError || attempt === 3) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  if (!response) {
    throw new Error('Gemini did not return a response after retries.');
  }
  return response.text;
}
