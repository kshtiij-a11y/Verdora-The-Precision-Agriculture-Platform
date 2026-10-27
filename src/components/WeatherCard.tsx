
"use client";

import { useState, useTransition, useEffect, FormEvent } from "react";
import { usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Sun, Loader2, Send, PlayCircle, StopCircle, AlertCircle } from "lucide-react";
import { summarizeWeatherData } from "@/ai/flows/summarize-weather-data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { translateAdvisoryAlerts } from "@/ai/flows/translate-advisory-alerts";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { sendSms } from "@/ai/flows/send-sms";
import { useAppContext } from "@/context/AppContext";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { fetchWeatherData } from "@/app/actions/weather";
import { useTranslation } from "@/hooks/useTranslation";
import { useOptionalFarmerAppContext } from "@/context/FarmerAppContext";

type ServerActionResult = {
  summary: string | null;
  error: string | null;
};

export function WeatherCard() {
  const pathname = usePathname();
  const isFarmerPortal = pathname.startsWith('/farmer');

  const { registeredFarmer, addSmsToHistory } = useAppContext();
  
  const farmerContext = useOptionalFarmerAppContext();
  const { availableLanguages = { English: 'English' } } = farmerContext || {};
  
  const [isForecastPending, startForecastTransition] = useTransition();
  const [isSmsPending, startSmsTransition] = useTransition();
  const [isAudioPending, startAudioTransition] = useTransition();
  const [result, setResult] = useState<ServerActionResult | null>(null);
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("English");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const getForecastForLocation = (loc: string, lang: string) => {
    if (!loc) {
        toast({
            variant: "destructive",
            title: "Missing Location",
            description: "Please enter a location to get the weather forecast.",
        });
        return;
    }

    startForecastTransition(async () => {
      try {
        setResult(null);
        setSmsStatus(null);
        if (audio) {
            audio.pause();
            setAudio(null);
        }
        
        let weatherData = await fetchWeatherData(loc);
        
        if (weatherData.error && loc.includes(',')) {
            const district = loc.split(',')[1]?.trim();
            if (district) {
                weatherData = await fetchWeatherData(district);
                if (!weatherData.error) {
                    setLocation(district); 
                }
            }
        }
        
        if (weatherData.error) {
            throw new Error(weatherData.error);
        }

        const summaryRes = await summarizeWeatherData({ location: weatherData.city || loc, weatherData: JSON.stringify(weatherData) });
        
        if (!summaryRes.summary) throw new Error("Empty summary returned.");

        if (lang === "English") {
            setResult({ summary: summaryRes.summary, error: null });
        } else {
            const translationRes = await translateAdvisoryAlerts({
                text: summaryRes.summary,
                language: lang,
            });

            if (translationRes.translatedText) {
                setResult({ summary: translationRes.translatedText, error: null });
            } else {
                throw new Error("Translation failed.");
            }
        }

      } catch (error: any) {
        console.error(error);
        const errorMessage = error.message.includes("not found") 
            ? `Could not find weather for "${loc}". Please check the spelling.`
            : error.message.includes("Translation")
                ? "Failed to translate weather summary."
                : "Failed to get weather summary. Please check your API key.";
        
        setResult({ summary: null, error: errorMessage });
        
        toast({
          variant: "destructive",
          title: "API Error",
          description: `${errorMessage}`,
        });
      }
    });
  };
  
  useEffect(() => {
    if (registeredFarmer) {
      const fullLocation = `${registeredFarmer.village}, ${registeredFarmer.district}`;
      setLocation(fullLocation);
      const farmerLang = isFarmerPortal ? farmerContext?.language : registeredFarmer.language;
      setLanguage(farmerLang || 'English');
      if (registeredFarmer.village && registeredFarmer.district) {
        getForecastForLocation(fullLocation, farmerLang || 'English');
      }
    } else {
      setLocation("");
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredFarmer, isFarmerPortal, farmerContext?.language]);
  
  const handleGetForecast = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    getForecastForLocation(location, language);
  };

  const handleSendSms = () => {
    if (!registeredFarmer) {
      toast({
        variant: "destructive",
        title: "No Farmer Registered",
        description: "Please register a farmer before sending an SMS.",
      });
      return;
    }
    if (result?.summary) {
        startSmsTransition(async () => {
            try {
                const message = `Weather for ${location}: ${result.summary!}`.substring(0, 115);
                const res = await sendSms({ to: registeredFarmer.phone, message: message });
                setSmsStatus(res.status);
                addSmsToHistory({
                  to: registeredFarmer.phone,
                  message: message,
                  type: 'Weather',
                });
                 toast({
                    title: "SMS Sent!",
                    description: `Message sent to ${registeredFarmer.name} at ${registeredFarmer.phone}`,
                });
            } catch (error) {
                console.error("SMS sending failed", error);
                setSmsStatus("Failed to send SMS.");
                toast({
                    variant: "destructive",
                    title: "SMS Error",
                    description: "Could not send the SMS. Please try again.",
                });
            }
        });
    }
  };

  const handlePlayAudio = () => {
    if (audio) {
        audio.pause();
        setAudio(null);
        return;
    }
    if (!result?.summary) return;

    startAudioTransition(async () => {
      try {
        const res = await textToSpeech({ text: result.summary! });
        if (res.error) {
            toast({
                variant: "destructive",
                title: "Audio Error",
                description: res.error,
            });
            return;
        }
        if (!res.audioDataUri) {
          throw new Error("Audio generation returned no data.");
        }
        const newAudio = new Audio(res.audioDataUri);
        setAudio(newAudio);
        newAudio.play();
        newAudio.addEventListener('ended', () => setAudio(null));
      } catch (error: any) {
        console.error("Audio generation failed", error);
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: error.message || "Could not generate audio. Please check your Gemini API key and try again.",
        });
      }
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Sun className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>{t('weather.title', 'Weather Forecast')}</CardTitle>
            <CardDescription>
              {t('weather.description', 'Get AI-powered weather summaries for your location.')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="flex-grow flex flex-col">
        <CardContent className="flex-grow">
          <form onSubmit={handleGetForecast} className="space-y-4">
            <div className="flex w-full flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-grow w-full">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('weather.locationPlaceholder', 'Enter location...')}
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                  <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-full sm:w-[120px]">
                          <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(availableLanguages).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                  <Button type="submit" disabled={isForecastPending} className="flex-grow">
                      {isForecastPending ? <Loader2 className="animate-spin" /> : t('weather.getForecast', 'Get Forecast')}
                  </Button>
              </div>
            </div>
          </form>
          <div className="mt-4 pt-4 border-t">
            {isForecastPending && (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            )}
             {result?.error && !isForecastPending && (
                <div className="text-center text-destructive py-4">
                    <p>{result.error}</p>
                </div>
            )}
            {result?.summary && !isForecastPending && (
              <div className="prose prose-sm max-w-none text-foreground">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold mb-2 text-foreground">{t('weather.summary', 'Weather Summary')} ({language}):</h4>
                    <Button variant="ghost" size="icon" onClick={handlePlayAudio} disabled={isAudioPending}>
                        {isAudioPending ? <Loader2 className="animate-spin" /> : (audio ? <StopCircle /> : <PlayCircle />)}
                    </Button>
                </div>
                <p>{result.summary}</p>
              </div>
            )}
            {smsStatus && !isSmsPending && (
                <Alert className="mt-4">
                    <Send className="w-4 h-4" />
                    <AlertTitle>SMS Status</AlertTitle>
                    <AlertDescription className="text-xs whitespace-pre-wrap break-words">
                        {smsStatus} for farmer {registeredFarmer?.name}.
                    </AlertDescription>
                </Alert>
            )}
            {!result && !isForecastPending && !smsStatus && (
                <div className="text-center text-muted-foreground py-4">
                    <p>{t('weather.enterLocationPrompt', 'Enter a location to see the weather summary.')}</p>
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSendSms} disabled={!result?.summary || isForecastPending || isSmsPending} className="w-full" variant="secondary" size="sm">
                {isSmsPending ? <><Loader2 className="animate-spin" /> {t('advisory.sending', 'Sending...')}</> : <><Send /> {t('weather.sendSms', 'Send as SMS')}</>}
            </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
