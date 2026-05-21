import { createApiClient } from "@tablebook/api-client";
import Constants from "expo-constants";

const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://192.168.15.88:3000";

let tokenGetter: (() => Promise<string | null>) | undefined;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export const api = createApiClient({
  baseUrl,
  getToken: () => (tokenGetter ? tokenGetter() : Promise.resolve(null))
});

export { createApiClient, baseUrl };
