import { api } from "./api";

export type PointsEntryType = "earned" | "redeemed";

export interface PointsBalance {
  balance: number;
  level: string;
}

export interface PointsHistoryEntry {
  id: string;
  amount: number;
  type: PointsEntryType;
  reason: string;
  reference?: string;
  created_at: string;
}

export interface PointsHistoryPage {
  entries: PointsHistoryEntry[];
  has_more: boolean;
  page: number;
}

export const pointsService = {
  getBalance: async (): Promise<PointsBalance> => {
    const res = await api.get<Partial<PointsBalance>>("/api/v1/points/balance");
    return {
      balance: Number(res.data?.balance ?? 0),
      level: res.data?.level ?? "bronce",
    };
  },

  getHistory: async (
    page = 1,
    type?: PointsEntryType,
  ): Promise<PointsHistoryPage> => {
    const res = await api.get<
      | PointsHistoryEntry[]
      | { entries?: PointsHistoryEntry[]; items?: PointsHistoryEntry[]; has_more?: boolean }
    >("/api/v1/points/history", {
      params: { page, ...(type ? { type } : {}) },
    });
    const data = res.data;
    const entries = Array.isArray(data)
      ? data
      : data.entries ?? data.items ?? [];
    const hasMore = Array.isArray(data)
      ? entries.length > 0
      : Boolean(data.has_more);
    return { entries, has_more: hasMore, page };
  },
};
