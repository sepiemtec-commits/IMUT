const path = require("path");
const { config: loadEnv } = require("dotenv");

// Carrega .env do app e da raiz do monorepo
loadEnv({ path: path.join(__dirname, ".env") });
loadEnv({ path: path.join(__dirname, "../../.env") });

const lanIp = process.env.EXPO_PUBLIC_LAN_IP || "192.168.0.23";
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL || `http://${lanIp}:3000`;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "IMUT",
    slug: "imut",
    version: "0.1.0",
    orientation: "portrait",
    scheme: "imut",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "app.imut.mobile",
      buildNumber: "1",
    },
    android: {
      package: "app.imut.mobile",
      versionCode: 1,
      permissions: ["INTERNET", "POST_NOTIFICATIONS", "VIBRATE"],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
    },
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          color: "#0ea5e9",
          defaultChannel: "imut_alerts",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "",
      },
    },
  },
};
