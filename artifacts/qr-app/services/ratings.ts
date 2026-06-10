import { api } from "./api";

export interface DishRatingResponse {
  id: string;
  points_earned?: number;
}

export interface RestaurantRatingResponse {
  id: string;
  points_earned?: number;
}

export const ratingService = {
  rateDish: async (
    productId: string,
    orderItemId: string,
    rating: number,
  ): Promise<DishRatingResponse> => {
    const res = await api.post<DishRatingResponse>("/api/v1/ratings/dish", {
      product_id: productId,
      order_item_id: orderItemId,
      rating,
    });
    return res.data;
  },

  writeDishReview: async (
    ratingId: string,
    reviewText: string,
  ): Promise<void> => {
    await api.post(`/api/v1/ratings/dish/${ratingId}/review`, {
      review: reviewText,
    });
  },

  rateRestaurant: async (
    branchId: string,
    sessionId: string,
    rating: number,
  ): Promise<RestaurantRatingResponse> => {
    const res = await api.post<RestaurantRatingResponse>(
      "/api/v1/ratings/restaurant",
      {
        branch_id: branchId,
        session_id: sessionId,
        rating,
      },
    );
    return res.data;
  },
};
