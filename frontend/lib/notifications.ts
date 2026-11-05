import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { apiRequest } from "./api";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function listNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>("/notifications/me", { auth: true });
}

export function markAllNotificationsRead(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>("/notifications/me/read-all", {
    method: "POST",
    auth: true,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return;
  }

  // Get the Expo Push Token
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // Send token to backend
    await apiRequest("/auth/push-token", {
      method: "POST",
      body: { expo_push_token: token },
      auth: true,
    });
    console.log("✅ Push token registered with backend!");
  } catch (e) {
    console.log("Failed to register push token", e);
  }
}