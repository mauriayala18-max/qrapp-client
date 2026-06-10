import { create } from "zustand";
import { Menu, Order, Session, TimeSlot } from "@/types";

interface SessionState {
  session: Session | null;
  menu: Menu | null;
  currentTimeSlot: TimeSlot | null;
  orders: Order[];
  setSession: (session: Session, menu?: Menu | null) => void;
  setMenu: (menu: Menu) => void;
  setCurrentTimeSlot: (slot: TimeSlot) => void;
  clearSession: () => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  menu: null,
  currentTimeSlot: null,
  orders: [],

  setSession: (session, menu) =>
    set({
      session,
      menu: menu ?? null,
      currentTimeSlot:
        session.current_time_slot ?? menu?.time_slots?.find((s) => s.active) ?? null,
    }),

  setMenu: (menu) => set({ menu }),

  setCurrentTimeSlot: (slot) => set({ currentTimeSlot: slot }),

  clearSession: () =>
    set({ session: null, menu: null, currentTimeSlot: null, orders: [] }),

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o,
      ),
    })),
}));
