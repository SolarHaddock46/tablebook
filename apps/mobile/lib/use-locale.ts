import { t, type Dictionary, type Locale } from "@tablebook/shared";
import { useAuth } from "@/lib/auth-context";

export function useLocale(): {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => Promise<void>;
} {
  const { locale, setLocale } = useAuth();
  return {
    locale,
    dict: t(locale),
    setLocale
  };
}
