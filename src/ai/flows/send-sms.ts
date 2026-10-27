
'use server';
/**
 * @fileOverview A flow to send an SMS using Twilio.
 *
 * - sendSms - A function that sends an SMS message.
 * - SendSmsInput - The input type for the sendSms function.
 * - SendSmsOutput - The return type for the sendSms function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Twilio from 'twilio';
import { twilioConfig } from '@/config';

const MAX_SMS_LENGTH = 160;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_PER_RECIPIENT = 3;
const recipientSendLog = new Map<string, number[]>();

const SendSmsInputSchema = z.object({
  to: z.string().describe('The phone number to send the SMS to, in E.164 format (e.g., +15551234567).'),
  message: z.string().describe('The content of the SMS message.'),
});
export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;

const SendSmsOutputSchema = z.object({
  status: z.string().describe('The status of the SMS sending attempt.'),
  messageSid: z.string().optional().describe('The SID of the message from Twilio.'),
});
export type SendSmsOutput = z.infer<typeof SendSmsOutputSchema>;

export async function sendSms(input: SendSmsInput): Promise<SendSmsOutput> {
  return sendSmsFlow(input);
}

function enforceRecipientRateLimit(recipient: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const history = recipientSendLog.get(recipient) ?? [];
  const recent = history.filter(timestamp => timestamp >= windowStart);

  if (recent.length >= RATE_LIMIT_MAX_PER_RECIPIENT) {
    throw new Error('Rate limit exceeded for this recipient. Please wait before sending another SMS.');
  }
}

function recordSuccessfulSend(recipient: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const history = recipientSendLog.get(recipient) ?? [];
  const recent = history.filter(timestamp => timestamp >= windowStart);
  recent.push(now);
  recipientSendLog.set(recipient, recent);
}

const sendSmsFlow = ai.defineFlow(
  {
    name: 'sendSmsFlow',
    inputSchema: SendSmsInputSchema,
    outputSchema: SendSmsOutputSchema,
  },
  async (input) => {
    let { to, message } = input;
    const { accountSid, authToken, phoneNumber } = twilioConfig;

    if (!accountSid || !authToken || !phoneNumber) {
        throw new Error('Twilio credentials are not configured correctly. Please check your config.ts and .env file.');
    }

    message = message.trim();
    if (!message) {
      throw new Error('SMS message cannot be empty.');
    }
    if (message.length > MAX_SMS_LENGTH) {
      throw new Error(`SMS message exceeds ${MAX_SMS_LENGTH} characters.`);
    }

    to = to.trim();
    if (/^\d{10}$/.test(to)) {
      to = `+91${to}`;
    } else if (!to.startsWith('+')) {
      to = `+${to}`;
    }

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(to)) {
      throw new Error(`Invalid phone number format: ${to}. Number must be in E.164 format (e.g., +15551234567).`);
    }

    enforceRecipientRateLimit(to);

    // Initialize Twilio client inside the flow to ensure credentials are loaded
    const client = Twilio(accountSid, authToken);

    try {
        const twilioMessage = await client.messages.create({
            body: message,
            from: phoneNumber,
            to: to,
        });
        recordSuccessfulSend(to);

        console.log(`SMS sent successfully. SID: ${twilioMessage.sid}`);
        return {
            status: `SMS sent successfully to ${to}`,
            messageSid: twilioMessage.sid,
        };
    } catch (error: any) {
        console.error('Failed to send SMS via Twilio:', error);
        throw new Error(`Failed to send SMS. Twilio error: ${error.message}`);
    }
  }
);
