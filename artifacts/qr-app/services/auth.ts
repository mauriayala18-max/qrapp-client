import { api } from "./api";
import { LoginResponse, RegisterData, UpdateProfileData, User } from "@/types";

export const authService = {
  login: async (
    email: string,
    password: string,
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/api/v1/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
      "/api/v1/auth/register",
      data,
    );
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>("/api/v1/auth/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await api.patch<User>("/api/v1/auth/me", data);
    return response.data;
  },
};
