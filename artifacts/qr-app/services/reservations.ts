import { api } from "./api";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rejected"
  | "completed";

export interface ReservationData {
  restaurant_id?: string;
  branch_id?: string;
  restaurant_name?: string;
  date: string;
  time: string;
  party_size: number;
  special_requests?: string;
}

export interface Reservation {
  id: string;
  restaurant_id?: string;
  branch_id?: string;
  restaurant_name?: string;
  date: string;
  time: string;
  party_size: number;
  status: ReservationStatus;
  special_requests?: string;
  created_at?: string;
}

export interface MyReservationsParams {
  upcoming?: boolean;
}

export const reservationService = {
  createReservation: async (data: ReservationData): Promise<Reservation> => {
    const res = await api.post<Reservation>("/api/v1/reservations", data);
    return res.data;
  },

  getMyReservations: async (
    params?: MyReservationsParams,
  ): Promise<Reservation[]> => {
    const res = await api.get<
      Reservation[] | { reservations?: Reservation[]; items?: Reservation[] }
    >("/api/v1/reservations/mine", { params });
    const data = res.data;
    if (Array.isArray(data)) return data;
    return data.reservations ?? data.items ?? [];
  },

  cancelReservation: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/reservations/${id}`);
  },
};
