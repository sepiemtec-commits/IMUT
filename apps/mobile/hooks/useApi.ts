import { useAuthStore } from "../store/auth.store";

export function useAccessToken(): string {
  const token = useAuthStore((s) => s.accessToken);
  if (!token) throw new Error("Não autenticado");
  return token;
}
