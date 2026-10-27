import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/context/AppContext';
import { MainContent } from '@/components/MainContent';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Verdora | The Precision Agriculture Platform',
  description: 'Verdora: The Precision Agriculture Platform for crop insights, weather, and farmer advisories.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/landing.css" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppProvider>
          <div className="min-h-screen bg-background text-foreground">
            <MainContent>
              {children}
            </MainContent>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
