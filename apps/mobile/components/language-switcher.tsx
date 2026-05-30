import { Text } from "react-native";
import { type Locale } from "@tablebook/shared";
import { OptionRow } from "@/components/OptionRow";
import { ui } from "@/components/ui";
import { useLocale } from "@/lib/use-locale";

export function LanguageSwitcher() {
  const { locale, dict, setLocale } = useLocale();
  const options = [
    { id: Constants.LocaleRu, title: dict.languageRu },
    { id: Constants.LocaleEn, title: dict.languageEn }
  ];

  return (
    <>
      <Text style={ui.label}>{dict.language}</Text>
      <OptionRow
        options={options}
        value={locale}
        onChange={(next) => {
          void setLocale(next as Locale);
        }}
      />
    </>
  );
}

enum Constants {
  LocaleRu = "ru",
  LocaleEn = "en"
}
