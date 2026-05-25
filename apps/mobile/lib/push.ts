import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
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
 */
export async function registerPushToken(authToken: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  // Token nativo FCM/APNs (requer dev build + credenciais FCM no EAS)
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
  const sub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as {
      alertId?: string;
      environment?: string;
    };
    onAlert(data);
  });
  return () => sub.remove();
}
