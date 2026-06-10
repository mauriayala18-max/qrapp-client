---
name: QR App (Expo) conventions & constraints
description: Non-obvious structure, theming, and data-model constraints for the qr-app Expo artifact
---

# QR App (Expo restaurant client)

- Module layout: NO `src/` prefix. The `@/` path alias maps to the qr-app root.
- Theming via `useColors()` hook (light theme); primary brand is `#FF6B35`. Spacing/fontSize/borderRadius/shadow live in `theme.ts`. All UI text is Spanish (Paraguay-focused).
- Toast pattern: `useToast()` + `<Toast visible={!!toast} .../>`. Error text via `getErrorMessage` from `@/services/api`.
- Session lives in `useSessionStore` (`session?.id`, `session?.branch?.id`, `session?.restaurant`). A reservation/order requires a scanned-QR session — guard submits when no `restaurant`/`branchId`.

## Data-model constraint: dish ratings have no order_item_id
**Rule:** `OrderItem` (types/index.ts) only has `product_id` — there is NO unique per-line `order_item_id`.
**Why:** the ratings spec asks for `orderItemId`, but the existing type can't supply one; modifying the shared type was out of scope.
**How to apply:** `rate.tsx` passes `product_id` for both the `productId` and `orderItemId` args of `rateDish`. If a real order-item id is ever added to `OrderItem`, switch to it.
