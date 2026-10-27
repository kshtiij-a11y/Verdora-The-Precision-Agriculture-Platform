
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Export the configuration variables
export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
};

export const geminiApiKey = process.env.GEMINI_API_KEY;

// Consolidated OpenWeather API Key for both server and client-side access if needed.
// Note: For security, it's better to use server-side actions for API calls.
export const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;

export const newsApiKey = process.env.NEWS_API_KEY;

export const elevenLabsConfig = {
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Default voice ID, can be changed
};

export const weatherConfig = {
    apiKey: process.env.OPENWEATHER_API_KEY,
};
