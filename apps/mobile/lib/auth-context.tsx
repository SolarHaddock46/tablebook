import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthUser, Locale } from "@tablebook/shared";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, createApiClient, setTokenGetter, baseUrl } from "./api";

const TOKEN_KEY = "tablebook_token";
const USER_KEY = "tablebook_user";
const LOCALE_KEY = "tablebook_locale";

async function storageGet(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string) {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

type RegisterInput = {
  email: string;
  password: string;
  role: "user" | "restaurant_owner";
  full_name?: string;
  phone?: string;
  preferred_cuisines?: string[];
  preferred_districts?: string[];
  preferred_price_level?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  locale: Locale;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ email_verified: boolean }>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [guestLocale, setGuestLocale] = useState<Locale>("ru");
  const [loading, setLoading] = useState(true);
  const locale: Locale = user?.locale ?? guestLocale;

  useEffect(() => {
    setTokenGetter(async () => token);
  }, [token]);

  useEffect(() => {
    async function bootstrap() {
      const storedLocale = await storageGet(LOCALE_KEY);
      if (storedLocale === "ru" || storedLocale === "en") {
        setGuestLocale(storedLocale);
      }

      const storedToken = await storageGet(TOKEN_KEY);
      const storedUser = await storageGet(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const client = createApiClient({
            baseUrl,
            getToken: async () => storedToken
          });
          const me = await client.getMe();
          setUser(me);
          await storageSet(USER_KEY, JSON.stringify(me));
          await storageSet(LOCALE_KEY, me.locale);
          setGuestLocale(me.locale);
        } catch {
          await storageDelete(TOKEN_KEY);
          await storageDelete(USER_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    bootstrap();
  }, []);

  async function persistSession(nextToken: string, nextUser: AuthUser) {
    setToken(nextToken);
    setUser(nextUser);
    setGuestLocale(nextUser.locale);
    await storageSet(TOKEN_KEY, nextToken);
    await storageSet(USER_KEY, JSON.stringify(nextUser));
    await storageSet(LOCALE_KEY, nextUser.locale);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      locale,
      loading,
      async login(email, password) {
        const result = await api.login({ email, password });
        await persistSession(result.accessToken, result.user);
        return { email_verified: result.user.email_verified };
      },
      async register(input) {
        const result = await api.register(input);
        await persistSession(result.accessToken, result.user);
      },
      async logout() {
        setToken(null);
        setUser(null);
        await storageDelete(TOKEN_KEY);
        await storageDelete(USER_KEY);
      },
      async refreshMe() {
        const me = await api.getMe();
        setUser(me);
        setGuestLocale(me.locale);
        await storageSet(LOCALE_KEY, me.locale);
        if (token) {
          await storageSet(USER_KEY, JSON.stringify(me));
        }
      },
      async setLocale(next) {
        setGuestLocale(next);
        await storageSet(LOCALE_KEY, next);
        if (user) {
          const me = await api.updateMe({ locale: next });
          setUser(me);
          if (token) {
            await storageSet(USER_KEY, JSON.stringify(me));
          }
        }
      }
    }),
    [loading, locale, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
