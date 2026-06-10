import { Order } from "@/types";

export type StatusGroup = "active" | "ready" | "done" | "cancelled";

export interface OrderStatusMeta {
  label: string;
  color: string;
  group: StatusGroup;
}

export const ORDER_STATUS_COLORS = {
  received: "#FF6B35",
  preparing: "#0984E3",
  ready: "#00B894",
  delivered: "#636E72",
  cancelled: "#FF7675",
} as const;

const STATUS_MAP: Record<string, OrderStatusMeta> = {
  pending: { label: "Recibido", color: ORDER_STATUS_COLORS.received, group: "active" },
  received: { label: "Recibido", color: ORDER_STATUS_COLORS.received, group: "active" },
  confirmed: { label: "Recibido", color: ORDER_STATUS_COLORS.received, group: "active" },
  preparing: { label: "En preparación", color: ORDER_STATUS_COLORS.preparing, group: "active" },
  in_preparation: { label: "En preparación", color: ORDER_STATUS_COLORS.preparing, group: "active" },
  ready: { label: "Listo", color: ORDER_STATUS_COLORS.ready, group: "ready" },
  delivered: { label: "Entregado", color: ORDER_STATUS_COLORS.delivered, group: "done" },
  completed: { label: "Entregado", color: ORDER_STATUS_COLORS.delivered, group: "done" },
  cancelled: { label: "Cancelado", color: ORDER_STATUS_COLORS.cancelled, group: "cancelled" },
  canceled: { label: "Cancelado", color: ORDER_STATUS_COLORS.cancelled, group: "cancelled" },
};

export function getOrderStatusMeta(status?: string | null): OrderStatusMeta {
  const key = (status ?? "").toLowerCase();
  return (
    STATUS_MAP[key] ?? {
      label: status || "Recibido",
      color: ORDER_STATUS_COLORS.received,
      group: "active",
    }
  );
}

/** Ordered status flow for the progress indicator. */
export const STATUS_FLOW: { key: StatusGroup; label: string; color: string }[] = [
  { key: "active", label: "Recibido", color: ORDER_STATUS_COLORS.received },
  { key: "active", label: "En preparación", color: ORDER_STATUS_COLORS.preparing },
  { key: "ready", label: "Listo", color: ORDER_STATUS_COLORS.ready },
];

/** Numeric step (0-based) for the Recibido → En preparación → Listo flow. */
export function getStatusStep(status?: string | null): number {
  const key = (status ?? "").toLowerCase();
  if (["ready"].includes(key)) return 2;
  if (["preparing", "in_preparation"].includes(key)) return 1;
  if (["delivered", "completed"].includes(key)) return 3;
  return 0;
}

export function isActiveOrder(status?: string | null): boolean {
  const g = getOrderStatusMeta(status).group;
  return g === "active" || g === "ready";
}

/** Sum the prep times of an order's items, with a sensible fallback. */
export function estimatedPrepMinutes(order: Order): number {
  const sum = order.items.reduce(
    (acc, i) => acc + (i.product?.prep_time_minutes ?? 0),
    0,
  );
  return sum > 0 ? sum : 20;
}
