
"use client";

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Bot, Mail, Phone } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function HelpCenter() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('help.faq1.question', "How do I register a new farmer?"),
      answer: t('help.faq1.answer', "Navigate to the main Dashboard. If no farmer is registered, you will see a form. Fill in the farmer's name, phone number, location, primary and secondary crops, and preferred language, then click 'Register Farmer'."),
    },
    {
      question: t('help.faq2.question', "How do I get a weather forecast?"),
      answer: t('help.faq2.answer', "Go to the 'Weather Forecast' page from the sidebar. If a farmer is registered, their location will be automatically used. You can also manually enter a location and select a language, then click 'Get Forecast'."),
    },
    {
      question: t('help.faq3.question', "How do I send an SMS alert?"),
      answer: t('help.faq3.answer', "On pages like Weather Forecast, Advisory Alerts, Crop Diagnosis, and Market Prices, there is a 'Send as SMS' button at the bottom. After generating content (like a forecast or diagnosis), click this button to send the information to the registered farmer."),
    },
    {
      question: t('help.faq4.question', "Can I change the registered farmer?"),
      answer: t('help.faq4.answer', "Yes. On the Dashboard, if a farmer is already registered, you will see their details. Click the 'Register Another Farmer' button to clear the current farmer and show the registration form again."),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-left text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-3">
          <LifeBuoy className="w-8 h-8 text-primary" />
          {t('help.title', 'Help Center')}
        </h2>
        <p className="text-white/80 max-w-2xl">
          {t('help.description', 'Find answers to your questions and get the support you need.')}
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('help.contact', 'Contact Support')}</CardTitle>
            <CardDescription>{t('help.contactDescription', 'Reach out to us directly for any inquiries.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                <Mail className="w-6 h-6 text-primary" />
                <div>
                    <p className="font-semibold">{t('help.emailSupport', 'Email Support')}</p>
                    <a href="mailto:support@verdora.ag" className="text-sm text-muted-foreground hover:underline">
                        support@verdora.ag
                    </a>
                </div>
             </div>
             <div className="flex items-center gap-4 p-4 bg-muted rounded-md">
                <Phone className="w-6 h-6 text-primary" />
                <div>
                    <p className="font-semibold">{t('help.phoneSupport', 'Phone Support')}</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('help.faq', 'Frequently Asked Questions (FAQ)')}</CardTitle>
            <CardDescription>
              {t('help.faqDescription', 'Find answers to common questions about the Verdora platform.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
