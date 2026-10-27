
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MessageSquareWarning, Sun, Stethoscope, TrendingUp, Bot, Languages, Speaker, Smartphone, Wheat, User } from "lucide-react";
import Image from "next/image";

export function LandingPage() {
  const features = [
    {
      icon: <Sun className="w-8 h-8 text-primary" />,
      title: "Weather Forecast",
      description: "Get AI-powered weather summaries for any location.",
    },
    {
      icon: <MessageSquareWarning className="w-8 h-8 text-primary" />,
      title: "Advisory Alerts",
      description: "Generate and send critical pest and advisory alerts to farmers.",
    },
    {
      icon: <Stethoscope className="w-8 h-8 text-primary" />,
      title: "Crop Diagnosis",
      description: "Identify crop diseases by simply uploading a photo of the plant.",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Market Prices",
      description: "Access indicative mandi rates for key crops to make informed selling decisions.",
    },
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: "Chat Assistant",
      description: "Ask the AI assistant anything about farming, crops, and weather.",
    },
    {
      icon: <Languages className="w-8 h-8 text-primary" />,
      title: "Multi-Language Support",
      description: "Translate alerts and interact with the app in 10 different Indian languages.",
    },
    {
      icon: <Speaker className="w-8 h-8 text-primary" />,
      title: "Text-to-Speech",
      description: "Listen to weather forecasts and advisory alerts in a clear, natural voice.",
    },
    {
        icon: <ArrowRight className="w-8 h-8 text-primary" />,
        title: "SMS Integration",
        description: "Deliver all critical information directly to farmers' mobile phones via SMS.",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-white">
      <main className="flex-1">
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12 space-y-2 fade-in">
              <div className="inline-block rounded-lg bg-black/20 px-3 py-1 text-sm">Key Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                A Comprehensive Toolkit for Modern Agriculture
              </h2>
              <p className="max-w-[900px] mx-auto text-white/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From weather predictions to pest detection, get everything you need to make informed decisions and boost your yield.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col feature-card transition-all duration-300 fade-in bg-card/80 backdrop-blur-sm" style={{ animationDelay: `${index * 150}ms` }}>
                  <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        {feature.icon}
                    </div>
                    <CardTitle className="text-lg text-card-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3 fade-in">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">How It Works</h2>
              <p className="mx-auto max-w-[600px] text-white/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Simple steps to connect farmers with vital information.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-8 pt-8">
              <div className="flex flex-col items-center space-y-4 fade-in delay-200 p-6 rounded-lg bg-card/80 backdrop-blur-sm">
                <div className="p-4 bg-primary rounded-full text-primary-foreground">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">1. Register Farmer</h3>
                <p className="text-sm text-muted-foreground">Easily register a farmer with their phone number, location, and primary crops via the dashboard.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 fade-in delay-400 p-6 rounded-lg bg-card/80 backdrop-blur-sm">
                <div className="p-4 bg-primary rounded-full text-primary-foreground">
                  <Wheat className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">2. Generate Insight</h3>
                <p className="text-sm text-muted-foreground">Use AI tools to get weather forecasts, generate pest alerts, or diagnose crop diseases from a photo.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 fade-in delay-600 p-6 rounded-lg bg-card/80 backdrop-blur-sm">
                <div className="p-4 bg-primary rounded-full text-primary-foreground">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">3. Send SMS</h3>
                <p className="text-sm text-muted-foreground">Instantly send the generated insight as a translated SMS, accessible on any mobile phone.</p>
              </div>
            </div>
          </div>
        </section>


      </main>

      <footer className="border-t border-white/10 py-4">
        <div className="container flex flex-col md:flex-row items-center justify-between text-sm text-white/70">
          <p>© {new Date().getFullYear()} Verdora | The Precision Agriculture Platform. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Repository maintenance: timestamp refresh only.
