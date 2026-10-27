
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

const systemPrompt = `You are Verdora's AI agricultural assistant, powered by Gemini. Answer a broad range of farming questions using your agricultural knowledge, including crop varieties, planting seasons, soil preparation, irrigation, fertilizers, pest and disease symptoms, safe integrated pest management, harvesting, storage, and general farm practices.

Use a concise, practical, respectful tone. Reply in the same language as the farmer. Ask a clarifying question when crop, region, growth stage, or symptoms materially affect the answer. For advice that could cause crop damage, avoid false certainty and recommend local agricultural extension guidance when needed.

Use tools when live or app-specific information is needed:
- Weather and forecasts: call getWeatherSummary. Never invent live weather.
- Market prices: call getMarketPrices, and clearly say when the app dataset has no matching record. Never present sample data as verified live market prices.
- Recent agriculture news: call getAgricultureNews and say if unavailable.
For general farming questions, answer directly from your knowledge instead of refusing just because a tool has no matching result. Distinguish general guidance from live data, and never fabricate sources, prices, weather, or news.

Keep advice focused on agriculture. Do not claim a photo provides a certain diagnosis when evidence is unclear. For pesticide use, emphasize label directions, local regulations, protective equipment, and avoiding unsafe mixtures.`;

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
        model: 'googleai/gemini-3.5-flash-lite',
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
      const isTemporaryServerError = /503|Service Unavailable|429|Too Many Requests|quota|high demand/i.test(message);
      if (!isTemporaryServerError || attempt === 3) {
        if (/429|quota|Too Many Requests/i.test(message)) {
          throw new Error('The AI assistant has reached its current API usage limit. Please try again after the quota resets.');
        }
        throw new Error('The AI assistant is temporarily unavailable. Please try again shortly.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  if (!response) {
    throw new Error('Gemini did not return a response after retries.');
  }
  return response.text;
}
