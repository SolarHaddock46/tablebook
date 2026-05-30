import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function RootNavigator() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const rootSegment = segments[0] as string | undefined;
    const inAuth = rootSegment === "(auth)";
    const authSegment = segments[1] as string | undefined;
    const inPublicAuthFlow =
      rootSegment === "verify-email" ||
      rootSegment === "review" ||
      rootSegment === "restaurant" ||
      rootSegment === "reset-password" ||
      (inAuth && authSegment === "reset-password");

    if (!user && !inAuth && !inPublicAuthFlow) {
      router.replace("/(auth)/login");
      return;
    }

    if (user?.role === "restaurant_owner" && rootSegment !== "(owner)" && !inAuth && !inPublicAuthFlow) {
      router.replace("/(owner)/bookings");
      return;
    }

    if (user?.role === "user" && rootSegment === "(owner)") {
      router.replace("/(tabs)/search");
    }
  }, [loading, router, segments, user]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
