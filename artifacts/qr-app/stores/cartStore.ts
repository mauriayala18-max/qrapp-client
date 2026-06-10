import { create } from "zustand";
import { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  sessionId: string | null;
  ensureSession: (sessionId: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  sessionId: null,

  ensureSession: (sessionId) => {
    if (get().sessionId !== sessionId) {
      set({ sessionId, items: [] });
    }
  },

  addItem: (item) => set((state) => ({ items: [...state.items, item] })),

  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),

  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== itemId)
          : state.items.map((i) => {
              if (i.id !== itemId) return i;
              const unit =
                i.totalPrice / Math.max(i.quantity, 1);
              return { ...i, quantity, totalPrice: unit * quantity };
            }),
    })),

  clearCart: () => set({ items: [] }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.totalPrice, 0),

  getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
