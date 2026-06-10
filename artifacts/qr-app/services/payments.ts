import { api } from "./api";
import {
  BankingBenefit,
  Payment,
  PaymentInput,
  PaymentLink,
  Split,
  SplitItem,
} from "@/types";

export const paymentService = {
  createPayment: async (data: PaymentInput): Promise<Payment> => {
    const res = await api.post<Payment>("/api/v1/payments", data);
    return res.data;
  },

  getSessionPayments: async (sessionId: string): Promise<Payment[]> => {
    const res = await api.get<Payment[] | { payments?: Payment[] }>(
      `/api/v1/sessions/${sessionId}/payments`,
    );
    return Array.isArray(res.data) ? res.data : res.data.payments ?? [];
  },

  createSplit: async (
    sessionId: string,
    method: Split["method"],
    participantsCount?: number,
  ): Promise<Split> => {
    const res = await api.post<Split>(`/api/v1/sessions/${sessionId}/split`, {
      method,
      participants_count: participantsCount,
    });
    return res.data;
  },

  claimItems: async (
    splitId: string,
    items: { item_id: string; participant_name?: string }[],
  ): Promise<Split> => {
    const res = await api.post<Split>(`/api/v1/splits/${splitId}/claim`, {
      items,
    });
    return res.data;
  },

  getSplit: async (splitId: string): Promise<Split> => {
    const res = await api.get<Split>(`/api/v1/splits/${splitId}`);
    return res.data;
  },

  createPaymentLink: async (
    sessionId: string,
    amount: number,
  ): Promise<PaymentLink> => {
    const res = await api.post<PaymentLink>(
      `/api/v1/sessions/${sessionId}/payment-link`,
      { amount },
    );
    return res.data;
  },

  getBankingBenefits: async (branchId: string): Promise<BankingBenefit[]> => {
    const res = await api.get<BankingBenefit[] | { benefits?: BankingBenefit[] }>(
      `/api/v1/branches/${branchId}/banking-benefits`,
    );
    return Array.isArray(res.data) ? res.data : res.data.benefits ?? [];
  },
};

export type { SplitItem };
