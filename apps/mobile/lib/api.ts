import Constants from "expo-constants";
import { Platform } from "react-native";

// No navegador web, localhost funciona; no celular usa o IP da rede
export const API_BASE_URL =
  Platform.OS === "web"
    ? "http://localhost:3000"
    : (process.env.EXPO_PUBLIC_API_URL ??
      (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
      "http://localhost:3000");

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/v1${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      (body as { message?: string }).message ??
        (body as { error?: string }).error ??
        res.statusText,
      res.status,
      (body as { error?: string }).error,
    );
  }

  return body as T;
}
