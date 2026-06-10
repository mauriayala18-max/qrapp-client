import { api } from "./api";
import { Menu, MenuProduct, ProductReview } from "@/types";

interface MenuParams {
  time_slot_id?: string;
  category_id?: string;
}

interface PaginatedReviews {
  reviews: ProductReview[];
  page: number;
  total_pages?: number;
  total?: number;
}

export const menuService = {
  getMenu: async (branchId: string, params?: MenuParams): Promise<Menu> => {
    const res = await api.get<Menu>(`/api/v1/branches/${branchId}/menu`, {
      params,
    });
    return res.data;
  },

  searchMenu: async (
    branchId: string,
    query: string,
  ): Promise<MenuProduct[]> => {
    const res = await api.get<MenuProduct[] | { products: MenuProduct[] }>(
      `/api/v1/branches/${branchId}/menu/search`,
      { params: { q: query } },
    );
    return Array.isArray(res.data) ? res.data : res.data.products;
  },

  getFeatured: async (branchId: string): Promise<MenuProduct[]> => {
    const res = await api.get<MenuProduct[] | { products: MenuProduct[] }>(
      `/api/v1/branches/${branchId}/menu/featured`,
    );
    return Array.isArray(res.data) ? res.data : res.data.products;
  },

  getProduct: async (productId: string): Promise<MenuProduct> => {
    const res = await api.get<MenuProduct>(`/api/v1/products/${productId}`);
    return res.data;
  },

  getProductReviews: async (
    productId: string,
    page = 1,
  ): Promise<PaginatedReviews> => {
    const res = await api.get<PaginatedReviews>(
      `/api/v1/products/${productId}/reviews`,
      { params: { page } },
    );
    return res.data;
  },
};
