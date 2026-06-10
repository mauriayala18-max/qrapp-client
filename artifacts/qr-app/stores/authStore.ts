import { create } from "zustand";
import { authService } from "@/services/auth";
import { RegisterData, UpdateProfileData, User } from "@/types";
import { TOKEN_KEY } from "@/constants/config";
import { secureStorage } from "@/utils/secureStorage";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ needsTerms?: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setGuest: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  completeOnboarding: (data: UpdateProfileData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  isNewUser: false,

  checkAuth: async () => {
    try {
      const token = await secureStorage.getItem(TOKEN_KEY);
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      const user = await authService.me();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      await secureStorage.deleteItem(TOKEN_KEY);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (email, password) => {
    const response = await authService.login(email, password);
    await secureStorage.setItem(TOKEN_KEY, response.token);
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isGuest: false,
      isNewUser: false,
    });
    return { needsTerms: response.needs_terms_acceptance };
  },

  register: async (data) => {
    const response = await authService.register(data);
    await secureStorage.setItem(TOKEN_KEY, response.token);
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isGuest: false,
      isNewUser: true,
    });
  },

  completeOnboarding: async (data) => {
    try {
      const user = await authService.updateProfile(data);
      set({ user, isNewUser: false });
    } catch {
      set({ isNewUser: false });
    }
  },

  logout: async () => {
    await secureStorage.deleteItem(TOKEN_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      isNewUser: false,
    });
  },

  setGuest: () => {
    set({ isGuest: true, isAuthenticated: false, isLoading: false, isNewUser: false });
  },

  updateProfile: async (data) => {
    const user = await authService.updateProfile(data);
    set({ user });
  },
}));
