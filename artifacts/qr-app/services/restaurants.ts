import { api } from "./api";
import {
  BankingBenefit,
  BranchProfile,
  BranchReview,
  DishSearchResult,
  Promotion,
  RestaurantPromotion,
  RestaurantSearchResult,
  SearchResults,
} from "@/types";

export interface SearchFilters {
  cuisines?: string[];
  dietary?: string[];
}

function toArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    for (const key of keys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

export const restaurantService = {
  // Global search across restaurants and dishes. Falls back to empty results
  // if the backend does not yet expose this endpoint.
  search: async (
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResults> => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (filters?.cuisines?.length) params.cuisines = filters.cuisines.join(",");
    if (filters?.dietary?.length) params.dietary = filters.dietary.join(",");

    const res = await api.get<unknown>("/api/v1/search", { params });
    const data = res.data as Record<string, unknown> | unknown;
    return {
      restaurants: toArray<RestaurantSearchResult>(data, "restaurants"),
      dishes: toArray<DishSearchResult>(data, "dishes", "products"),
    };
  },

  getBranchProfile: async (branchId: string): Promise<BranchProfile> => {
    const res = await api.get<BranchProfile>(`/api/v1/branches/${branchId}`);
    return res.data;
  },

  getNearby: async (): Promise<RestaurantSearchResult[]> => {
    const res = await api.get<unknown>("/api/v1/restaurants/nearby");
    return toArray<RestaurantSearchResult>(res.data, "restaurants", "items");
  },

  getPromotions: async (): Promise<Promotion[]> => {
    const res = await api.get<unknown>("/api/v1/promotions");
    return toArray<Promotion>(res.data, "promotions", "items");
  },

  getBranchPromotions: async (
    branchId: string,
  ): Promise<RestaurantPromotion[]> => {
    const res = await api.get<unknown>(
      `/api/v1/branches/${branchId}/promotions`,
    );
    return toArray<RestaurantPromotion>(res.data, "promotions", "items");
  },

  getBankingBenefits: async (branchId: string): Promise<BankingBenefit[]> => {
    const res = await api.get<unknown>(
      `/api/v1/branches/${branchId}/banking-benefits`,
    );
    return toArray<BankingBenefit>(res.data, "benefits", "items");
  },

  getReviews: async (branchId: string): Promise<BranchReview[]> => {
    const res = await api.get<unknown>(`/api/v1/branches/${branchId}/reviews`);
    return toArray<BranchReview>(res.data, "reviews", "items");
  },
};
