import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiFetch } from "./api";

// expo-notifications foi removido do Expo Go no SDK 53+
// Em produção (dev build / EAS), importe de expo-notifications normalmente
let Notifications: typeof import("expo-notifications") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require("expo-notifications");
} catch {
  // Expo Go: módulo não disponível
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === "android" && Notifications) {
    await Notifications.setNotificationChannelAsync("imut_alerts", {
      name: "Alertas IMUT",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/**
 * Solicita permissão e registra token FCM/Expo na API.
 * Em produção, use EAS + FCM credentials no Expo dashboard.
 * No Expo Go SDK 53+ as notificações push remotas não estão disponíveis.
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  if (!Device.isDevice || !Notifications) return null;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  let token: string;
  try {
    const device = await Notifications.getDevicePushTokenAsync();
    token =
      typeof device.data === "string" ? device.data : String(device.data);
  } catch {
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const expo = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    token = expo.data;
  }

  const platform =
    Platform.OS === "ios" ? "IOS" : Platform.OS === "android" ? "ANDROID" : "WEB";

  await apiFetch("/push-tokens", {
    method: "POST",
    token: authToken,
    body: JSON.stringify({ token, platform }),
  });

  return token;
}

export function useAlertNotificationListener(
  onAlert: (data: { alertId?: string; environment?: string }) => void,
): () => void {
  if (!Notifications) return () => {};
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as {
      alertId?: string;
      environment?: string;
    };
    onAlert(data);
  });
  return () => sub.remove();
}
