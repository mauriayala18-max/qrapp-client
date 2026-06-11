/**
 * Platform-aware secure storage.
 * Native: expo-secure-store (encrypted keychain/keystore)
 * Web: AsyncStorage (localStorage fallback — tokens are ephemeral on web)
 *
 * All operations are total: they never throw. A storage backend that is
 * unavailable (e.g. expo-secure-store on web, where
 * `deleteValueWithKeyAsync` is not implemented) resolves to a safe default
 * instead of crashing callers such as checkAuth() or the 401 interceptor.
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

async function getStore(): Promise<typeof webStorage> {
  return Platform.OS === "web" ? webStorage : getNativeStore();
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const store = await getStore();
      return await store.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      const store = await getStore();
      await store.setItemAsync(key, value);
    } catch {
      // Storage unavailable — ignore so callers never crash.
    }
  },
  async deleteItem(key: string): Promise<void> {
    try {
      const store = await getStore();
      await store.deleteItemAsync(key);
    } catch {
      // Storage unavailable — ignore so callers never crash.
    }
  },
};
