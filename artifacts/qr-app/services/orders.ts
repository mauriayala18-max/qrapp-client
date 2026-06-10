import { api } from "./api";
import { CartItem, Order, Session } from "@/types";

export interface CreateOrderItemPayload {
  product_id: string;
  quantity: number;
  notes?: string;
  modifications?: { group_id: string; option_id: string }[];
}

function toItemPayload(items: CartItem[]): CreateOrderItemPayload[] {
  return items.map((i) => ({
    product_id: i.product.id,
    quantity: i.quantity,
    notes: i.notes,
    modifications: i.modifications.map((m) => ({
      group_id: m.group_id,
      option_id: m.option_id,
    })),
  }));
}

export const orderService = {
  createOrder: async (
    sessionId: string,
    items: CartItem[],
    notes?: string,
  ): Promise<Order> => {
    const res = await api.post<Order>("/api/v1/orders", {
      session_id: sessionId,
      items: toItemPayload(items),
      notes,
    });
    return res.data;
  },

  getOrder: async (orderId: string): Promise<Order> => {
    const res = await api.get<Order>(`/api/v1/orders/${orderId}`);
    return res.data;
  },

  getSessionOrders: async (sessionId: string): Promise<Order[]> => {
    const res = await api.get<Session | Order[] | { orders?: Order[] }>(
      `/api/v1/sessions/${sessionId}`,
    );
    const data = res.data as Session | Order[] | { orders?: Order[] };
    if (Array.isArray(data)) return data;
    return data.orders ?? [];
  },

  cancelOrder: async (
    orderId: string,
    reason?: string,
    itemId?: string,
  ): Promise<Order> => {
    const res = await api.post<Order>(`/api/v1/orders/${orderId}/cancel`, {
      reason,
      item_id: itemId,
    });
    return res.data;
  },

  getBranchActiveOrders: async (branchId: string): Promise<Order[]> => {
    const res = await api.get<Order[] | { orders?: Order[] }>(
      `/api/v1/branches/${branchId}/orders/active`,
    );
    return Array.isArray(res.data) ? res.data : res.data.orders ?? [];
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await api.get<Order[] | { orders?: Order[] }>("/api/v1/orders");
    return Array.isArray(res.data) ? res.data : res.data.orders ?? [];
  },
};
