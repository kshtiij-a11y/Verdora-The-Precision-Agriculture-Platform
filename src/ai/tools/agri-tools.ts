
'use server';
/**
 * @fileOverview A set of Genkit tools for agricultural data.
 *
 * - getWeatherSummary - A tool to get a weather summary for a location.
 * - getMarketPrices - A tool to get market prices for specified crops.
 * - getAgricultureNews - A tool to fetch agriculture-related news.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { summarizeWeatherData } from '@/ai/flows/summarize-weather-data';
import { openWeatherApiKey, newsApiKey } from '@/config';

// More realistic mock data with min, modal, and max prices per location.
const mockMarketData = {
  wheat: {
    Patna: { min: 2000, modal: 2150, max: 2250 },
    Indore: { min: 2100, modal: 2200, max: 2300 },
    Mumbai: { min: 2200, modal: 2350, max: 2450 },
  },
  rice: {
    Lucknow: { min: 2800, modal: 2950, max: 3050 },
    Pune: { min: 3000, modal: 3100, max: 3200 },
    Kolkata: { min: 2900, modal: 3000, max: 3100 },
  },
  corn: {
    Patna: { min: 1500, modal: 1650, max: 1720 },
    Indore: { min: 1600, modal: 1700, max: 1800 },
    'Hyderabad': { min: 1650, modal: 1750, max: 1850 },
  },
  tomatoes: {
      'Bangalore': { min: 1800, modal: 2000, max: 2200 },
      'Delhi': { min: 1900, modal: 2100, max: 2300 },
      'Pune': { min: 1700, modal: 1900, max: 2100 },
  },
  onions: {
      'Nasik': { min: 2200, modal: 2500, max: 2800 },
      'Indore': { min: 2100, modal: 2400, max: 2700 },
      'Delhi': { min: 2300, modal: 2600, max: 2900 },
  }
};


async function fetchWeatherDataForTool(location: string): Promise<string> {
    const normalizedLocation = location.trim();
    if (!normalizedLocation) {
      return "Location is required.";
    }
    if (!openWeatherApiKey) {
      return "OpenWeather API key is not configured. I cannot fetch live weather data.";
    }
    const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(normalizedLocation)}&limit=1&appid=${openWeatherApiKey}`);
    if (!geoResponse.ok) {
      return `Failed to geocode location '${normalizedLocation}'. The API key might be invalid or inactive.`;
    }
    const geoData = await geoResponse.json();
    if (geoData.length === 0) {
      return `Could not find location: ${normalizedLocation}`;
    }
    const { lat, lon } = geoData[0];
  
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${openWeatherApiKey}`);
    if (!forecastResponse.ok) {
       return "Failed to fetch weather data.";
    }
    const forecastData = await forecastResponse.json();
  
    const simplifiedForecast = forecastData.list.map((item: any) => ({
      date: item.dt_txt,
      temp_c: item.main.temp,
      condition: item.weather[0].description,
      wind_speed_mps: item.wind.speed,
      precipitation_chance: item.pop,
    }));
  
    return JSON.stringify({ location: normalizedLocation, forecast: simplifiedForecast }, null, 2);
}

export const getWeatherSummary = ai.defineTool(
    {
      name: 'getWeatherSummary',
      description: 'Provides a concise weather forecast summary for a specified location.',
      inputSchema: z.object({
        location: z.string().describe('The city or area for which to get the weather forecast.'),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      const weatherData = await fetchWeatherDataForTool(input.location);
      // Check if fetchWeatherDataForTool returned an error message
      if (weatherData.startsWith("Failed") || weatherData.startsWith("Could not find") || weatherData.startsWith("OpenWeather")) {
          return weatherData;
      }
      const summary = await summarizeWeatherData({ location: input.location, weatherData });
      return summary.summary;
    }
);

const MarketPriceOutputSchema = z.object({
  found: z.boolean().describe("Whether price data was found for the given crop and location."),
  crop: z.string().describe("The name of the crop."),
  location: z.string().describe("The market location for the price."),
  minPrice: z.number().optional().describe("The minimum price per quintal."),
  modalPrice: z.number().optional().describe("The most common (modal) price per quintal."),
  maxPrice: z.number().optional().describe("The maximum price per quintal."),
});
export type MarketPriceOutput = z.infer<typeof MarketPriceOutputSchema>;

export const getMarketPrices = ai.defineTool(
  {
    name: 'getMarketPrices',
    description: 'Returns indicative market price (per quintal) for a specified crop and location from the app dataset.',
    inputSchema: z.object({
      crop: z.string().describe('The name of the crop to get the price for.'),
      location: z.string().describe('The market location (mandi) for the price check.'),
    }),
    outputSchema: MarketPriceOutputSchema,
  },
  async (input) => {
    const cropName = input.crop.toLowerCase() as keyof typeof mockMarketData;
    const locationName = input.location;

    const cropData = mockMarketData[cropName];
    if (!cropData) {
      return { found: false, crop: input.crop, location: input.location };
    }

    // Find the location with a case-insensitive match
    const locationKey = Object.keys(cropData).find(
      (loc) => loc.toLowerCase() === locationName.toLowerCase()
    ) as keyof typeof cropData | undefined;
    
    if (!locationKey) {
        return { found: false, crop: input.crop, location: input.location };
    }

    const priceInfo = cropData[locationKey] as { min: number; modal: number; max: number };
    return {
        found: true,
        crop: input.crop,
        location: locationKey,
        minPrice: priceInfo.min,
        modalPrice: priceInfo.modal,
        maxPrice: priceInfo.max,
    };
  }
);

export const getAgricultureNews = ai.defineTool(
    {
        name: 'getAgricultureNews',
        description: 'Fetches recent agriculture-related news headlines for a given country.',
        inputSchema: z.object({
            country: z.string().describe('The 2-letter ISO 3166-1 code of the country to get news for (e.g., us, in).'),
        }),
        outputSchema: z.string(),
    },
    async ({ country }) => {
        const normalizedCountry = country.trim().toLowerCase();
        if (!/^[a-z]{2}$/.test(normalizedCountry)) {
            return 'Country must be a 2-letter ISO country code (e.g., in, us).';
        }
        if (!newsApiKey) {
            return 'News API key is not configured. I cannot fetch news articles.';
        }
        
        const url = `https://newsapi.org/v2/top-headlines?country=${encodeURIComponent(normalizedCountry)}&category=science&q=agriculture&pageSize=5&apiKey=${newsApiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                return `Failed to fetch news. Status: ${response.status}. Message: ${errorData.message}`;
            }
            
            const data = await response.json();
            
            if (data.articles.length === 0) {
                return 'No recent agriculture-related news found.';
            }
            
            const headlines = data.articles.map((article: any) => `- ${article.title}`).join('\n');
            return `Here are the latest agriculture headlines:\n${headlines}`;

        } catch (error: any) {
            console.error('Failed to fetch news from NewsAPI:', error);
            return `An error occurred while fetching news: ${error.message}`;
        }
    }
);
