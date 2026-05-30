import { Link, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MultiOptionRow, OptionRow } from "@/components/OptionRow";
import { Screen, ui } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/use-locale";
import { buildCuisineOptions, buildDistrictOptions, buildPriceLevelOptions } from "@/lib/filter-options";
import { t } from "@tablebook/shared";

const Constants = {
  StepAccount: 1,
  StepProfile: 2,
  StepPreferences: 3
} as const;

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { locale, dict } = useLocale();
  const [step, setStep] = useState<number>(Constants.StepAccount);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "restaurant_owner">("user");
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [preferredDistricts, setPreferredDistricts] = useState<string[]>([]);
  const [preferredPriceLevel, setPreferredPriceLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cuisineOptions = buildCuisineOptions(locale, dict.anyCuisine);
  const districtOptions = buildDistrictOptions(locale, dict.anyDistrict);
  const priceLevelOptions = buildPriceLevelOptions(locale, dict.anyPrice);

  async function handleSignup() {
    setLoading(true);
    setError(null);
    try {
      await register({
        email: email.trim(),
        password,
        role,
        full_name: fullName.trim(),
        phone: phone.trim(),
        preferred_cuisines: role === "user" && preferredCuisines.length > 0 ? preferredCuisines : undefined,
        preferred_districts: role === "user" && preferredDistricts.length > 0 ? preferredDistricts : undefined,
        preferred_price_level:
          role === "user" && preferredPriceLevel ? Number(preferredPriceLevel) : undefined
      });
      router.replace("/(auth)/verify-email" as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function handleNextFromAccount() {
    if (!email.trim() || password.length < 8) {
      setError(dict.signupStep1Error);
      return;
    }
    setError(null);
    setStep(Constants.StepProfile);
  }

  function handleNextFromProfile() {
    if (!fullName.trim() || phone.trim().length < 5) {
      setError(dict.signupStep2Error);
      return;
    }
    setError(null);
    if (role === "restaurant_owner") {
      void handleSignup();
      return;
    }
    setStep(Constants.StepPreferences);
  }

  function handleBack() {
    setError(null);
    if (step === Constants.StepProfile) {
      setStep(Constants.StepAccount);
      return;
    }
    if (step === Constants.StepPreferences) {
      setStep(Constants.StepProfile);
    }
  }

  return (
    <Screen title={dict.signup} scrollable>
      <LanguageSwitcher />
      <Text style={ui.muted}>{renderStepLabel(step, role, dict)}</Text>
      {step === Constants.StepAccount ? renderAccountStep() : null}
      {step === Constants.StepProfile ? renderProfileStep() : null}
      {step === Constants.StepPreferences ? renderPreferencesStep() : null}
      {error ? <Text style={{ color: "#f87171" }}>{error}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {step > Constants.StepAccount ? (
          <Pressable style={[ui.button, { flex: 1, backgroundColor: "#334155" }]} onPress={handleBack} disabled={loading}>
            <Text style={[ui.buttonText, { color: "#f8fafc" }]}>{dict.back}</Text>
          </Pressable>
        ) : null}
        {renderPrimaryAction()}
      </View>
      <Link href="/(auth)/login" style={ui.link}>
        {dict.login}
      </Link>
    </Screen>
  );

  function renderAccountStep() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={[ui.card, { flex: 1, borderColor: role === "user" ? "#06b6d4" : "#334155" }]}
            onPress={() => setRole("user")}
          >
            <Text style={ui.value}>{dict.registerAsGuest}</Text>
          </Pressable>
          <Pressable
            style={[ui.card, { flex: 1, borderColor: role === "restaurant_owner" ? "#06b6d4" : "#334155" }]}
            onPress={() => setRole("restaurant_owner")}
          >
            <Text style={ui.value}>{dict.registerAsOwner}</Text>
          </Pressable>
        </View>
        <TextInput
          style={ui.input}
          placeholder={dict.email}
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={ui.input}
          placeholder={`${dict.password} (min 8)`}
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </>
    );
  }

  function renderProfileStep() {
    return (
      <>
        <TextInput
          style={ui.input}
          placeholder={dict.fullName}
          placeholderTextColor="#64748b"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={ui.input}
          placeholder={dict.phone}
          placeholderTextColor="#64748b"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </>
    );
  }

  function renderPreferencesStep() {
    return (
      <>
        <Text style={ui.muted}>{dict.signupPreferencesHint}</Text>
        <Text style={ui.label}>{dict.cuisine}</Text>
        <MultiOptionRow options={cuisineOptions} values={preferredCuisines} onChange={setPreferredCuisines} />
        <Text style={ui.label}>{dict.district}</Text>
        <MultiOptionRow options={districtOptions} values={preferredDistricts} onChange={setPreferredDistricts} />
        <Text style={ui.label}>{dict.price}</Text>
        <OptionRow options={priceLevelOptions} value={preferredPriceLevel} onChange={setPreferredPriceLevel} />
      </>
    );
  }

  function renderPrimaryAction() {
    if (step === Constants.StepAccount) {
      return (
        <Pressable style={[ui.button, { flex: 1 }]} onPress={handleNextFromAccount} disabled={loading}>
          <Text style={ui.buttonText}>{dict.signupNext}</Text>
        </Pressable>
      );
    }

    if (step === Constants.StepProfile) {
      return (
        <Pressable style={[ui.button, { flex: 1 }]} onPress={handleNextFromProfile} disabled={loading}>
          <Text style={ui.buttonText}>
            {loading ? "..." : role === "restaurant_owner" ? dict.signupCreateAccount : dict.signupNext}
          </Text>
        </Pressable>
      );
    }

    return (
      <Pressable style={[ui.button, { flex: 1 }]} onPress={handleSignup} disabled={loading}>
        <Text style={ui.buttonText}>{loading ? "..." : dict.signupCreateAccount}</Text>
      </Pressable>
    );
  }
}

function renderStepLabel(step: number, role: "user" | "restaurant_owner", dict: ReturnType<typeof t>) {
  const totalSteps = role === "restaurant_owner" ? 2 : 3;
  if (step === Constants.StepAccount) {
    return dict.signupStep1Title.replace("3", String(totalSteps));
  }
  if (step === Constants.StepProfile) {
    return dict.signupStep2Title.replace("3", String(totalSteps));
  }
  return dict.signupStep3Title;
}
