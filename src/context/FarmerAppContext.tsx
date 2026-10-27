
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAppContext } from './AppContext';

import en from '@/translations/en.json';
import hi from '@/translations/hi.json';
import bn from '@/translations/bn.json';
import te from '@/translations/te.json';
import mr from '@/translations/mr.json';
import ta from '@/translations/ta.json';
import ur from '@/translations/ur.json';
import gu from '@/translations/gu.json';
import kn from '@/translations/kn.json';
import pa from '@/translations/pa.json';


const translations: { [key: string]: any } = {
  English: en,
  Hindi: hi,
  Bengali: bn,
  Telugu: te,
  Marathi: mr,
  Tamil: ta,
  Urdu: ur,
  Gujarati: gu,
  Kannada: kn,
  Punjabi: pa,
};

const availableLanguages = {
  English: "English",
  Hindi: "हिन्दी",
  Bengali: "বাংলা",
  Telugu: "తెలుగు",
  Marathi: "मराठी",
  Tamil: "தமிழ்",
  Urdu: "اردو",
  Gujarati: "ગુજરાતી",
  Kannada: "ಕನ್ನಡ",
  Punjabi: "ਪੰਜਾਬੀ",
};

interface FarmerAppContextType {
  language: string;
  setLanguage: (language: string) => void;
  translations: any;
  availableLanguages: { [key: string]: string };
}

const FarmerAppContext = createContext<FarmerAppContextType | undefined>(undefined);

export const FarmerAppProvider = ({ children }: { children: ReactNode }) => {
  const { registeredFarmer } = useAppContext();
  const [language, setLanguageState] = useState<string>('English');
  const [currentTranslations, setCurrentTranslations] = useState(translations.English);

  const setLanguage = useCallback((lang: string) => {
    if (translations[lang]) {
      setLanguageState(lang);
      setCurrentTranslations(translations[lang]);
    }
  }, []);
  
  // Set language from registered farmer's preference when it changes
  useEffect(() => {
    if (registeredFarmer?.language && translations[registeredFarmer.language]) {
        setLanguage(registeredFarmer.language);
    } else {
        // Default to English if no farmer is registered or language is not set
        setLanguage('English');
    }
  }, [registeredFarmer, setLanguage]);

  const value = {
    language,
    setLanguage,
    translations: currentTranslations,
    availableLanguages
  };

  return (
    <FarmerAppContext.Provider value={value}>
      {children}
    </FarmerAppContext.Provider>
  );
};

export const useFarmerAppContext = () => {
  const context = useContext(FarmerAppContext);
  if (context === undefined) {
    throw new Error('useFarmerAppContext must be used within a FarmerAppProvider');
  }
  return context;
};

// Allows shared components to read farmer preferences outside the farmer portal.
export const useOptionalFarmerAppContext = () => useContext(FarmerAppContext);
