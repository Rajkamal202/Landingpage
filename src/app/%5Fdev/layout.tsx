import { AppProviders } from "../app/providers";

/**
 * The gallery exercises tooltips, toasts and query-backed components, so it
 * needs the same provider tree the app runs under — otherwise a primitive can
 * look fine here and fail in the product.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
