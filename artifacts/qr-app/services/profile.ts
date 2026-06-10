import { api } from "./api";
import { UpdateProfileData, User } from "@/types";

export type FavoriteType = "restaurant" | "product";

export interface FavoriteRestaurant {
  id: string;
  restaurant_id?: string;
  name: string;
  cuisine_type?: string;
  rating?: number;
  logo?: string;
  color?: string;
}

export interface FavoriteProduct {
  id: string;
  product_id?: string;
  name: string;
  restaurant_name?: string;
  price: number;
  image?: string;
}

export interface UserFavorites {
  restaurants: FavoriteRestaurant[];
  products: FavoriteProduct[];
}

export const profileService = {
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const res = await api.patch<User>("/api/v1/auth/me", data);
    return res.data;
  },

  getUserFavorites: async (): Promise<UserFavorites> => {
    const res = await api.get<
      UserFavorites | { restaurants?: FavoriteRestaurant[]; products?: FavoriteProduct[] }
    >("/api/v1/favorites");
    const data = res.data ?? {};
    return {
      restaurants: Array.isArray(data.restaurants) ? data.restaurants : [],
      products: Array.isArray(data.products) ? data.products : [],
    };
  },

  addFavorite: async (
    type: FavoriteType,
    id: string,
  ): Promise<{ id: string }> => {
    const res = await api.post<{ id: string }>("/api/v1/favorites", {
      type,
      target_id: id,
    });
    return res.data;
  },

  removeFavorite: async (favoriteId: string): Promise<void> => {
    await api.delete(`/api/v1/favorites/${favoriteId}`);
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete("/api/v1/auth/me");
  },
};
