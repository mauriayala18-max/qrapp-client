/**
 * Platform-aware secure storage.
 * Native: expo-secure-store (encrypted keychain/keystore)
 * Web: AsyncStorage (localStorage fallback — tokens are ephemeral on web)
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const webStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};

let _nativeStore: typeof webStorage | null = null;

async function getNativeStore(): Promise<typeof webStorage> {
  if (!_nativeStore) {
    const SecureStore = await import("expo-secure-store");
    _nativeStore = {
      getItemAsync: (k) => SecureStore.getItemAsync(k),
      setItemAsync: (k, v) => SecureStore.setItemAsync(k, v),
      deleteItemAsync: (k) => SecureStore.deleteItemAsync(k),
    };
  }
  return _nativeStore;
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") return webStorage.getItemAsync(key);
    const store = await getNativeStore();
    return store.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") return webStorage.setItemAsync(key, value);
    const store = await getNativeStore();
    return store.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") return webStorage.deleteItemAsync(key);
    const store = await getNativeStore();
    return store.deleteItemAsync(key);
  },
};
