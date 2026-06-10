import { api } from "./api";
import { ScanResponse, Session } from "@/types";

export const sessionService = {
  joinSession: async (
    token: string,
    platform: string,
    name?: string,
  ): Promise<ScanResponse> => {
    const res = await api.post<ScanResponse>("/api/v1/sessions/join", {
      token,
      platform,
      name,
    });
    return res.data;
  },

  scanAndJoin: async (
    token: string,
    platform: string,
    name?: string,
  ): Promise<ScanResponse> => {
    const res = await api.post<ScanResponse>("/api/v1/sessions/scan", {
      token,
      platform,
      name,
    });
    return res.data;
  },

  getSession: async (sessionId: string): Promise<Session> => {
    const res = await api.get<Session>(`/api/v1/sessions/${sessionId}`);
    return res.data;
  },

  callWaiter: async (
    sessionId: string,
    reasonId?: string,
    customReason?: string,
  ): Promise<void> => {
    await api.post(`/api/v1/sessions/${sessionId}/call-waiter`, {
      reason_id: reasonId,
      custom_reason: customReason,
    });
  },
};
