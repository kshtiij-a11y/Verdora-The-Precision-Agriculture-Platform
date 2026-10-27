
"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquareWarning, Loader2, Send, Lightbulb, PlayCircle, StopCircle } from "lucide-react";
import { translateAdvisoryAlerts } from "@/ai/flows/translate-advisory-alerts";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { sendSms } from "@/ai/flows/send-sms";
import { useAppContext } from "@/context/AppContext";
import { generateAdvisoryAlert } from "@/ai/flows/generate-advisory-alert";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { useTranslation } from "@/hooks/useTranslation";
import { useOptionalFarmerAppContext } from "@/context/FarmerAppContext";

export function AdvisoryAlerts() {
  const pathname = usePathname();
  const isFarmerPortal = pathname.startsWith('/farmer');

  const { registeredFarmer, addSmsToHistory } = useAppContext();
  
  const farmerContext = useOptionalFarmerAppContext();
  const { availableLanguages = { English: 'English' } } = farmerContext || {};
  
  const [isTranslatePending, startTranslateTransition] = useTransition();
  const [isSmsPending, startSmsTransition] = useTransition();
  const [isGeneratePending, startGenerateTransition] = useTransition();
  const [isAudioPending, startAudioTransition] = useTransition();
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [alertText, setAlertText] = useState<string>("");
  const [language, setLanguage] = useState("English");
  const [smsStatus, setSmsStatus] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (registeredFarmer) {
      const farmerLang = isFarmerPortal ? farmerContext?.language : registeredFarmer.language;
      setLanguage(farmerLang || 'English');
      handleGenerateAlert();
    } else {
      setAlertText("");
      setTranslatedText(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredFarmer, isFarmerPortal, farmerContext?.language]);

  const handleGenerateAlert = () => {
    if (!registeredFarmer) {
      toast({
        variant: "destructive",
        title: "No Farmer Registered",
        description: "Please register a farmer to generate an alert.",
      });
      return;
    }

    setAlertText("");
    setTranslatedText(null);
    setSmsStatus(null);
    if (audio) {
        audio.pause();
        setAudio(null);
    }
    
    startGenerateTransition(async () => {
      try {
        const res = await generateAdvisoryAlert({
          location: `${registeredFarmer.village}, ${registeredFarmer.district}`,
          crop: registeredFarmer.crop,
        });
        if (res?.alert) {
          setAlertText(res.alert);
        } else {
          throw new Error("Failed to generate an alert.");
        }
      } catch (err: any) {
        console.error("Alert generation failed:", err);
        toast({
          variant: "destructive",
          title: "Generation Error",
          description: err.message || "Could not generate an advisory alert. Please try again.",
        });
      }
    });
  };

  const handleTranslate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!alertText) {
      toast({
        variant: "destructive",
        title: "No Alert",
        description: "Please generate an alert before translating.",
      });
      return;
    }

    setSmsStatus(null);
    setTranslatedText(null);
    if (audio) {
        audio.pause();
        setAudio(null);
    }
    startTranslateTransition(async () => {
      try {
        if (language === "English") {
          setTranslatedText(alertText);
          return;
        }
        const res = await translateAdvisoryAlerts({
          text: alertText,
          language,
        });
        if (res?.translatedText) {
          setTranslatedText(res.translatedText);
        } else {
          throw new Error("The translation result was empty.");
        }
      } catch (err: any) {
        console.error("Translation failed:", err);
        // Keep the original alert sendable when translation service is unavailable.
        setTranslatedText(alertText);
        toast({
          variant: "destructive",
          title: "Translation Unavailable",
          description: "The original English alert is ready to send by SMS.",
        });
      }
    });
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
    const messageToSend = translatedText || alertText;
    if (messageToSend) {
      startSmsTransition(async () => {
        try {
          const res = await sendSms({ to: registeredFarmer.phone, message: messageToSend });
          setSmsStatus(res.status);
          addSmsToHistory({
            to: registeredFarmer.phone,
            message: messageToSend,
            type: 'Advisory',
          });
          toast({
              title: "SMS Sent!",
              description: res.status || `Message sent to ${registeredFarmer.name} at ${registeredFarmer.phone}`,
          });
        } catch (error) {
          console.error("SMS sending failed", error);
          setSmsStatus("Failed to send SMS.");
          toast({
              variant: "destructive",
              title: "SMS Error",
              description: error instanceof Error ? error.message : "Could not send the SMS. Please try again.",
          });
        }
      });
    }
  };

  const handlePlayAudio = (textToPlay: string | null) => {
    if (audio) {
      audio.pause();
      setAudio(null);
      return;
    }
    if (!textToPlay) return;

    startAudioTransition(async () => {
      try {
        const res = await textToSpeech({ text: textToPlay });
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <MessageSquareWarning className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>{t('advisory.title', 'Advisory & Pest Alerts')}</CardTitle>
            <CardDescription>
              {t('advisory.description', 'Generate and send critical alerts to farmers.')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <div className="flex flex-col flex-grow">
        <CardContent className="space-y-4 flex-grow">
          <Button onClick={handleGenerateAlert} disabled={isGeneratePending || !registeredFarmer} className="w-full">
              {isGeneratePending ? (
                <>
                  <Loader2 className="animate-spin" /> {t('advisory.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <Lightbulb /> {t('advisory.generateAlert', 'Generate Alert for')} {registeredFarmer ? `${registeredFarmer.village}, ${registeredFarmer.district}` : '...'}
                </>
              )}
          </Button>

          {(alertText && !isGeneratePending) && (
            <div className="p-4 bg-muted rounded-md border mt-4">
              <div className="flex justify-between items-start">
                  <h4 className="font-semibold mb-2">{t('advisory.generatedAlert', 'Generated Alert (English):')}</h4>
                   <Button variant="ghost" size="icon" onClick={() => handlePlayAudio(alertText)} disabled={isAudioPending}>
                      {isAudioPending && !translatedText ? <Loader2 className="animate-spin" /> : (audio && !translatedText ? <StopCircle /> : <PlayCircle />)}
                   </Button>
              </div>
              <p className="text-sm text-muted-foreground">{alertText}</p>
            </div>
          )}
          
          <form onSubmit={handleTranslate} className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <label htmlFor="language-select" className="text-sm font-medium">{t('advisory.targetLanguage', 'Target Language')}</label>
              <Select value={language} onValueChange={setLanguage} disabled={!alertText}>
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue placeholder={t('advisory.selectLanguage', 'Select a language')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableLanguages).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isTranslatePending || !alertText} className="w-full">
              {isTranslatePending ? (
                <>
                  <Loader2 className="animate-spin" /> {t('advisory.translating', 'Translating...')}
                </>
              ) : (
                t('advisory.translate', 'Translate Alert')
              )}
            </Button>
          </form>

          {translatedText && !isTranslatePending && (
            <div className="p-4 bg-muted rounded-md border mt-4">
              <div className="flex justify-between items-start">
                  <h4 className="font-semibold mb-2">{t('advisory.translatedAlert', 'Translated Alert')} ({language}):</h4>
                  <Button variant="ghost" size="icon" onClick={() => handlePlayAudio(translatedText)} disabled={isAudioPending}>
                      {isAudioPending && !!translatedText ? <Loader2 className="animate-spin" /> : (audio && !!translatedText ? <StopCircle /> : <PlayCircle />)}
                   </Button>
              </div>
              <p className="text-sm text-muted-foreground">{translatedText}</p>
            </div>
          )}

          {smsStatus && !isSmsPending && (
            <Alert className="mt-4">
              <Send className="w-4 h-4" />
              <AlertTitle>{t('advisory.smsStatus', 'SMS Status')}</AlertTitle>
              <AlertDescription className="text-xs whitespace-pre-wrap break-words">
                 {smsStatus} for farmer {registeredFarmer?.name}.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSendSms} 
            disabled={(!translatedText && !alertText) || isTranslatePending || isSmsPending} 
            className="w-full"
            variant="secondary"
            size="sm"
          >
             {isSmsPending ? <><Loader2 className="animate-spin" /> {t('advisory.sending', 'Sending...')}</> : <><Send /> {t('advisory.sendSms', 'Send as SMS')}</>}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
