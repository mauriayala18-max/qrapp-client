import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "es" | "en" | "pt";
export type FontSizePref = "small" | "normal" | "large";

const STORAGE_KEY = "qr_app_settings";

interface SettingsState {
  language: Language;
  darkMode: boolean;
  fontSize: FontSizePref;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLanguage: (language: Language) => void;
  setDarkMode: (darkMode: boolean) => void;
  setFontSize: (fontSize: FontSizePref) => void;
}

function persist(state: Pick<SettingsState, "language" | "darkMode" | "fontSize">) {
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      language: state.language,
      darkMode: state.darkMode,
      fontSize: state.fontSize,
    }),
  ).catch(() => {});
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: "es",
  darkMode: false,
  fontSize: "normal",
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        set({
          language: parsed.language ?? "es",
          darkMode: Boolean(parsed.darkMode),
          fontSize: parsed.fontSize ?? "normal",
          hydrated: true,
        });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setLanguage: (language) => {
    set({ language });
    persist(get());
  },
  setDarkMode: (darkMode) => {
    set({ darkMode });
    persist(get());
  },
  setFontSize: (fontSize) => {
    set({ fontSize });
    persist(get());
  },
}));
