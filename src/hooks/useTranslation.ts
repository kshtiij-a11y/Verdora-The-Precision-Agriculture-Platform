"use client";

import { useAppContext } from "@/context/AppContext";
import { useOptionalFarmerAppContext } from "@/context/FarmerAppContext";
import { usePathname } from "next/navigation";

export const useTranslation = () => {
  const pathname = usePathname();
  const isFarmerPortal = pathname.startsWith('/farmer');
  const globalContext = useAppContext();
  const farmerContext = useOptionalFarmerAppContext();

  const translations = isFarmerPortal && farmerContext
    ? farmerContext.translations
    : globalContext.translations;

  const t = (key: string, defaultText?: string): string => {
    if (!translations) {
      return defaultText || key;
    }

    const result = key.split('.').reduce<any>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return current[part];
      }
      return undefined;
    }, translations);

    return typeof result === 'string' ? result : (defaultText || key);
  };

  return { t };
};
