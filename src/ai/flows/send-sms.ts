'use server';
/**
 * @fileOverview Send a concise SMS through Twilio.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import Twilio from 'twilio';
import { twilioConfig } from '@/config';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_PER_RECIPIENT = 3;
const recipientSendLog = new Map<string, number[]>();

const SendSmsInputSchema = z.object({
  to: z.string().describe('Recipient phone number.'),
  message: z.string().describe('SMS content.'),
});
export type SendSmsInput = z.infer<typeof SendSmsInputSchema>;

const SendSmsOutputSchema = z.object({
  status: z.string(),
  messageSid: z.string().optional(),
});
export type SendSmsOutput = z.infer<typeof SendSmsOutputSchema>;

export async function sendSms(input: SendSmsInput): Promise<SendSmsOutput> {
  return sendSmsFlow(input);
}

function enforceRecipientRateLimit(recipient: string) {
  const now = Date.now();
  const recent = (recipientSendLog.get(recipient) ?? []).filter(t => t >= now - RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_PER_RECIPIENT) {
    throw new Error('SMS limit reached for this number. Wait 10 minutes before trying again.');
  }
}

function recordSuccessfulSend(recipient: string) {
  const now = Date.now();
  const recent = (recipientSendLog.get(recipient) ?? []).filter(t => t >= now - RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  recipientSendLog.set(recipient, recent);
}

// Keep every outgoing app SMS to one short GSM-friendly segment where possible.
function shortenSms(value: string) {
  const plain = value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= 145 && /^[\x00-\x7F]*$/.test(plain)) return plain;
  const ascii = plain.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '');
  return ascii.length <= 142 ? ascii : `${ascii.slice(0, 139).trimEnd()}...`;
}

const sendSmsFlow = ai.defineFlow(
  { name: 'sendSmsFlow', inputSchema: SendSmsInputSchema, outputSchema: SendSmsOutputSchema },
  async (input) => {
    let { to, message } = input;
    const { accountSid, authToken, phoneNumber, messagingServiceSid } = twilioConfig;
    if (!accountSid || !authToken || (!phoneNumber && !messagingServiceSid)) {
      throw new Error('SMS is not configured: check the Twilio account SID, auth token, and sender number or messaging service.');
    }

    to = to.trim();
    if (/^\d{10}$/.test(to)) to = `+91${to}`;
    else if (!to.startsWith('+')) to = `+${to}`;
    if (!/^\+[1-9]\d{1,14}$/.test(to)) {
      throw new Error('Invalid recipient number. Use a 10-digit Indian mobile number or international format.');
    }

    message = shortenSms(message);
    if (!message) throw new Error('SMS content is empty.');
    enforceRecipientRateLimit(to);

    const client = Twilio(accountSid, authToken);
    try {
      const sent = await client.messages.create({
        body: message,
        ...(messagingServiceSid ? { messagingServiceSid } : { from: phoneNumber }),
        to,
      });
      recordSuccessfulSend(to);
      console.log('SMS sent successfully', { sid: sent.sid, recipientLast4: to.slice(-4), length: message.length });
      return { status: 'SMS sent successfully.', messageSid: sent.sid };
    } catch (error: any) {
      const code = typeof error?.code === 'number' ? error.code : undefined;
      const raw = String(error?.message ?? 'Unknown Twilio error');
      console.error('Twilio SMS failed', { code, status: error?.status, message: raw });
      if (/trial accounts|trial account|unverified|verified recipient|upgrade your account|disallowed parameters/i.test(raw) || code === 21608) {
        throw new Error('Twilio trial restriction: verify this recipient in the Twilio Console or upgrade the Twilio account. Shortening the message cannot bypass this restriction.');
      }
      if (code === 21606 || code === 21612 || code === 21408) {
        throw new Error('Twilio rejected the sender or destination. Check that the sender is enabled for SMS and permitted to message this country.');
      }
      throw new Error(`SMS delivery failed${code ? ` (Twilio ${code})` : ''}. Check the Twilio Messaging logs for the exact reason.`);
    }
  }
);
