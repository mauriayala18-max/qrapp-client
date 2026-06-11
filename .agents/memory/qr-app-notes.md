---
name: QR App (Expo) conventions & constraints
description: Non-obvious structure, theming, and data-model constraints for the qr-app Expo artifact
---

# QR App (Expo restaurant client)

- Module layout: NO `src/` prefix. The `@/` path alias maps to the qr-app root.
- Theming via `useColors()` hook (light theme); primary brand is `#FF6B35`. Spacing/fontSize/borderRadius/shadow live in `theme.ts`. All UI text is Spanish (Paraguay-focused).
- Toast pattern: `useToast()` + `<Toast visible={!!toast} .../>`. Error text via `getErrorMessage` from `@/services/api`.
- Session lives in `useSessionStore` (`session?.id`, `session?.branch?.id`, `session?.restaurant`). A reservation/order requires a scanned-QR session — guard submits when no `restaurant`/`branchId`.

## 401 interceptor must not logout on background/polling requests
**Rule:** Polling or cosmetic API calls (e.g. notification unread-count) must pass `{ _skipAuthError: true }` to `api.get/post/etc`. The global 401 interceptor in `services/api.ts` skips `_onUnauthorized` for these requests. `_logoutInProgress` guards against concurrent logout from simultaneous 401s.
**Why:** The notification unread-count poll fires immediately after login. If the backend returns 401 for that endpoint (not yet deployed, missing permissions, etc.), the old interceptor cleared the token and called logout — bouncing the user back to the login screen right after a successful login.
**How to apply:** Any new background/non-auth-critical API call should pass `{ _skipAuthError: true }`. Auth-critical screens (profile data, order submission, etc.) should keep default behavior (logout on 401).

## SafeAreaView belongs at the root layout, not per-screen
**Rule:** Wrap the entire navigation in a `SafeAreaView` in `app/_layout.tsx` (inside `RootLayoutNav`), not scattered across individual screens. Use `<StatusBar style="dark" />` from `expo-status-bar` at the same level for consistent dark-content on light backgrounds.
**Why:** content overlapping the system status bar was a common visual bug across screens because no global SafeAreaView existed. Fixing it screen-by-screen would be fragile and easy to miss when adding new routes.
**How to apply:** keep `SafeAreaProvider` at the root in `RootLayout` (it still sets up context for `useSafeAreaInsets` deeper in the tree), but add the actual `SafeAreaView` wrapper around the `Stack` router in `RootLayoutNav`.

## expo-secure-store is not supported on web → secureStorage must never throw
**Rule:** `utils/secureStorage.ts` is the only place that may touch `expo-secure-store`, and every op (getItem/setItem/deleteItem) must (a) route `Platform.OS === "web"` to AsyncStorage and (b) be wrapped so it can never throw (return null/void on failure).
**Why:** on web, expo-secure-store's native methods are undefined (`ExpoSecureStore.default.deleteValueWithKeyAsync is not a function`). The throw was uncaught because storage is called from `checkAuth()`'s catch block and from the 401 interceptor in `services/api.ts` (the latter now fired by the home-screen unread-count poll) → app crash via ErrorBoundary/redbox.
**How to apply:** never call expo-secure-store directly elsewhere; keep secureStorage total. A storage failure should degrade to "no token", not crash auth/startup.

## Data-model constraint: dish ratings have no order_item_id
**Rule:** `OrderItem` (types/index.ts) only has `product_id` — there is NO unique per-line `order_item_id`.
**Why:** the ratings spec asks for `orderItemId`, but the existing type can't supply one; modifying the shared type was out of scope.
**How to apply:** `rate.tsx` passes `product_id` for both the `productId` and `orderItemId` args of `rateDish`. If a real order-item id is ever added to `OrderItem`, switch to it.
