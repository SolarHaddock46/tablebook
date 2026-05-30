import { useEffect, useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { MultiOptionRow, OptionRow } from "@/components/OptionRow";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Screen, ui } from "@/components/ui";
import { buildCuisineOptions, buildDistrictOptions, buildPriceLevelOptions } from "@/lib/filter-options";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/use-locale";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { locale, dict } = useLocale();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>(user?.preferred_cuisines ?? []);
  const [preferredDistricts, setPreferredDistricts] = useState<string[]>(user?.preferred_districts ?? []);
  const [preferredPriceLevel, setPreferredPriceLevel] = useState(
    user?.preferred_price_level ? String(user.preferred_price_level) : ""
  );
  const [message, setMessage] = useState<string | null>(null);

  const cuisineOptions = buildCuisineOptions(locale, dict.anyCuisine);
  const districtOptions = buildDistrictOptions(locale, dict.anyDistrict);
  const priceLevelOptions = buildPriceLevelOptions(locale, dict.anyPrice);

  useEffect(() => {
    setDisplayName(user?.display_name ?? "");
    setFullName(user?.full_name ?? "");
    setPhone(user?.phone ?? "");
    setPreferredCuisines(user?.preferred_cuisines ?? []);
    setPreferredDistricts(user?.preferred_districts ?? []);
    setPreferredPriceLevel(user?.preferred_price_level ? String(user.preferred_price_level) : "");
  }, [user]);

  async function handleSave() {
    await api.updateMe({
      display_name: displayName.trim() || undefined,
      full_name: fullName.trim() || null,
      phone: phone.trim() || null
    });
    if (user?.role === "user") {
      await api.updatePreferences({
        preferred_cuisines: preferredCuisines.length > 0 ? preferredCuisines : null,
        preferred_districts: preferredDistricts.length > 0 ? preferredDistricts : null,
        preferred_price_level: preferredPriceLevel ? Number(preferredPriceLevel) : null
      });
    }
    await refreshMe();
    setMessage(dict.profileSaved);
  }

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  return (
    <Screen title={dict.profile} scrollable>
      <Text style={ui.muted}>{user?.email}</Text>
      <LanguageSwitcher />
      <TextInput
        style={ui.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={dict.displayName}
        placeholderTextColor="#64748b"
      />
      <TextInput
        style={ui.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder={dict.fullName}
        placeholderTextColor="#64748b"
      />
      <TextInput
        style={ui.input}
        value={phone}
        onChangeText={setPhone}
        placeholder={dict.phone}
        placeholderTextColor="#64748b"
        keyboardType="phone-pad"
      />
      {user?.role === "user" ? (
        <>
          <Text style={ui.label}>{dict.cuisine}</Text>
          <MultiOptionRow options={cuisineOptions} values={preferredCuisines} onChange={setPreferredCuisines} />
          <Text style={ui.label}>{dict.district}</Text>
          <MultiOptionRow options={districtOptions} values={preferredDistricts} onChange={setPreferredDistricts} />
          <Text style={ui.label}>{dict.price}</Text>
          <OptionRow options={priceLevelOptions} value={preferredPriceLevel} onChange={setPreferredPriceLevel} />
        </>
      ) : null}
      {message ? <Text style={ui.link}>{message}</Text> : null}
      <Pressable style={ui.button} onPress={handleSave}>
        <Text style={ui.buttonText}>{dict.save}</Text>
      </Pressable>
      <Pressable style={[ui.button, { backgroundColor: "#334155" }]} onPress={handleLogout}>
        <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.logout}</Text>
      </Pressable>
    </Screen>
  );
}
