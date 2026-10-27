'use server';

import { weatherConfig } from '@/config';

type ForecastPoint = {
  dt_txt: string;
  temp: string;
  feels_like: string;
  humidity: string;
  weather: string;
  wind_speed: string;
};

type WeatherResult = {
  city?: string;
  country?: string;
  forecast?: ForecastPoint[];
  error?: string;
};

export async function fetchWeatherData(location: string): Promise<WeatherResult> {
  const normalizedLocation = location.trim();

  if (!normalizedLocation) {
    return { error: 'Location is required.' };
  }

  const apiKey = weatherConfig.apiKey;
  if (!apiKey) {
    return { error: 'OpenWeather API key is not configured.' };
  }

  try {
    const geoUrl = new URL('https://api.openweathermap.org/geo/1.0/direct');
    geoUrl.searchParams.set('q', normalizedLocation);
    geoUrl.searchParams.set('limit', '1');
    geoUrl.searchParams.set('appid', apiKey);

    const geoResponse = await fetch(geoUrl.toString(), { cache: 'no-store' });
    if (!geoResponse.ok) {
      return { error: `Location lookup failed (HTTP ${geoResponse.status}). Check the OpenWeather API key and try again.` };
    }

    const geoData = await geoResponse.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      return { error: `Location "${normalizedLocation}" not found.` };
    }

    const { lat, lon } = geoData[0];
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return { error: 'The weather service returned invalid location coordinates.' };
    }

    const weatherUrl = new URL('https://api.openweathermap.org/data/2.5/forecast');
    weatherUrl.searchParams.set('lat', String(lat));
    weatherUrl.searchParams.set('lon', String(lon));
    weatherUrl.searchParams.set('appid', apiKey);
    weatherUrl.searchParams.set('units', 'metric');

    const weatherResponse = await fetch(weatherUrl.toString(), { cache: 'no-store' });
    if (!weatherResponse.ok) {
      return { error: `Weather forecast request failed (HTTP ${weatherResponse.status}).` };
    }

    const weatherData = await weatherResponse.json();
    if (String(weatherData.cod) !== '200' || !Array.isArray(weatherData.list) || !weatherData.city) {
      return { error: weatherData.message || 'The weather service returned an invalid forecast.' };
    }

    const processedForecast: ForecastPoint[] = weatherData.list.slice(0, 16).map((item: any) => ({
      dt_txt: String(item.dt_txt ?? ''),
      temp: `${item.main?.temp ?? 'N/A'}°C`,
      feels_like: `${item.main?.feels_like ?? 'N/A'}°C`,
      humidity: `${item.main?.humidity ?? 'N/A'}%`,
      weather: String(item.weather?.[0]?.description ?? 'Conditions unavailable'),
      wind_speed: `${item.wind?.speed ?? 'N/A'} m/s`,
    }));

    if (processedForecast.length === 0) {
      return { error: 'The weather service returned no forecast periods.' };
    }

    return {
      city: String(weatherData.city.name ?? normalizedLocation),
      country: String(weatherData.city.country ?? ''),
      forecast: processedForecast,
    };
  } catch (error) {
    console.error('Failed to fetch weather data from OpenWeather:', error);
    return { error: 'Unable to retrieve the weather forecast right now. Please try again.' };
  }
}
