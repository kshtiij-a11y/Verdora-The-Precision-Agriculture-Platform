
"use client";

import { chat, ChatInput } from "@/ai/flows/chat";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Send, User, Upload, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useRef, useState, useTransition, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

type ContentPart = { text: string; media?: never } | { text?: never; media: { url: string } };

type Message = {
  role: "user" | "model";
  content: ContentPart[];
};

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setImagePreview(URL.createObjectURL(file));
        setImageData(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = () => {
    if ((!input.trim() && !imageData) || isPending) return;

    const userMessageContent: ContentPart[] = [];
    if (input.trim()) {
        userMessageContent.push({ text: input });
    }
    if (imagePreview) {
        userMessageContent.push({ media: { url: imagePreview } });
    }

    const userMessage: Message = { role: "user", content: userMessageContent };
    
    // Optimistically update the UI with the user's message
    setMessages((prev) => [...prev, userMessage]);
    
    const chatInput: ChatInput = {
      history: messages.map(m => ({
          role: m.role,
          content: m.content.filter(c => c.text).map(c => ({ text: c.text! }))
      })),
      prompt: input,
      imageDataUri: imageData || undefined,
    };
    
    setInput("");
    handleRemoveImage();

    startTransition(async () => {
        try {
            const responseText = await chat(chatInput);
            const modelMessage: Message = {
                role: 'model',
                content: [{ text: responseText }],
            };
            setMessages((prev) => [...prev, modelMessage]);
        } catch (error: any) {
            console.error("Chat failed:", error);
            
            const rawErrorMessage = error instanceof Error ? error.message : String(error);
            let displayMessage = "Sorry, I encountered an error. Please try again.";
            if (rawErrorMessage.includes('429') || rawErrorMessage.toLowerCase().includes('quota')) {
                displayMessage = "The AI service has reached its request limit. Please try again after the quota resets or the project limit is increased.";
            } else if (rawErrorMessage.includes('503') || rawErrorMessage.includes('Service Unavailable')) {
                displayMessage = "The AI model is temporarily overloaded. Please wait a moment and try again.";
            }

            const errorMessage: Message = {
                role: 'model',
                content: [{ text: displayMessage }],
            };
            // Revert the optimistic UI update and add an error message instead
            setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
        }
    });
  };


  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage();
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  }

  return (
    <Card className="h-full flex flex-col max-h-[85vh]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>{t('chat.title', 'AI Chat Assistant')}</CardTitle>
            <CardDescription>
              {t('chat.description', 'Ask me anything about farming, crops, and weather.')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        <ScrollArea className="flex-grow" ref={scrollAreaRef} viewportRef={viewportRef}>
          <div className="space-y-4 pr-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "model" && (
                  <div className="p-2 bg-primary/10 text-primary rounded-full">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-4 py-2 text-sm space-y-2 break-words",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.content.map((part, partIndex) => {
                    if (part.text) {
                      return <p key={partIndex}>{part.text}</p>;
                    }
                    if (part.media) {
                      return (
                        <Image
                          key={partIndex}
                          src={part.media.url}
                          alt="User upload"
                          width={200}
                          height={200}
                          className="rounded-md object-contain"
                        />
                      );
                    }
                    return null;
                  })}
                </div>
                 {msg.role === "user" && (
                  <div className="p-2 bg-muted/80 text-foreground rounded-full">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isPending && (
                <div className="flex items-start gap-3 justify-start">
                    <div className="p-2 bg-primary/10 text-primary rounded-full">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-muted text-foreground rounded-lg px-4 py-2 text-sm flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        {t('chat.thinking', 'Thinking...')}
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-6 border-t">
        <div className="w-full">
            {imagePreview && (
                <div className="mb-2 relative w-fit">
                    <Image src={imagePreview} alt="Image preview" width={80} height={80} className="rounded-md object-cover"/>
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={handleRemoveImage}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
                    <Upload />
                    <span className="sr-only">{t('chat.uploadImage', 'Upload Image')}</span>
                </Button>
                <Input
                    type="text"
                    placeholder={t('chat.placeholder', 'Ask a question...')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                    className="flex-grow"
                />
                <Button type="submit" disabled={isPending || (!input.trim() && !imageData)}>
                    {isPending ? <Loader2 className="animate-spin"/> : <Send/>}
                    <span className="sr-only">{t('chat.send', 'Send')}</span>
                </Button>
            </form>
        </div>
      </CardFooter>
    </Card>
  );
}

    