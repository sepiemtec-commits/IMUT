import { Redirect } from "expo-router";
import { useAuthStore } from "../store/auth.store";

export default function Index() {
  const isAuth = useAuthStore((s) => s.isAuthenticated());

  if (isAuth) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
