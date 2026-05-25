const path = require("path");
const { config: loadEnv } = require("dotenv");

// Carrega .env do app e da raiz do monorepo
loadEnv({ path: path.join(__dirname, ".env") });
loadEnv({ path: path.join(__dirname, "../../.env") });

const isProduction = process.env.NODE_ENV === "production" || process.env.EAS_BUILD === "true";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ||
  (isProduction ? "https://api.imut.app" : "http://192.168.0.23:3000");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "IMUT",
    slug: "imut",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "imut",
    userInterfaceStyle: "light",
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
      permissions: ["INTERNET", "VIBRATE"],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
    },
    plugins: [
      "expo-router",
      "expo-web-browser",
      "expo-secure-store",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "f3babce0-4664-492a-a2b2-23248c973d3e",
      },
    },
    owner: "velfe",
  },
};
