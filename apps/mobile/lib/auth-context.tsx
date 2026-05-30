import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthUser } from "@tablebook/shared";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, createApiClient, setTokenGetter, baseUrl } from "./api";

const TOKEN_KEY = "tablebook_token";
const USER_KEY = "tablebook_user";

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

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ email_verified: boolean }>;
  register: (
    email: string,
    password: string,
    role: "user" | "restaurant_owner",
    displayName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTokenGetter(async () => token);
  }, [token]);

  useEffect(() => {
    async function bootstrap() {
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
    await storageSet(TOKEN_KEY, nextToken);
    await storageSet(USER_KEY, JSON.stringify(nextUser));
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const result = await api.login({ email, password });
        await persistSession(result.accessToken, result.user);
        return { email_verified: result.user.email_verified };
      },
      async register(email, password, role, displayName) {
        const result = await api.register({
          email,
          password,
          role,
          display_name: displayName
        });
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
        if (token) {
          await storageSet(USER_KEY, JSON.stringify(me));
        }
      }
    }),
    [loading, token, user]
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
