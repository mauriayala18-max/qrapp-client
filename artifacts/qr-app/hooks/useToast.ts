import { useCallback, useEffect, useRef, useState } from "react";

export type ToastType = "success" | "info" | "error";

export interface ToastState {
  message: string;
  type: ToastType;
}

/**
 * Lightweight toast state manager. Pair with the `Toast` component:
 *   const { toast, showToast } = useToast();
 *   <Toast visible={!!toast} message={toast?.message ?? ""} type={toast?.type} />
 */
export function useToast(duration = 2600) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({ message, type });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { toast, showToast };
}
