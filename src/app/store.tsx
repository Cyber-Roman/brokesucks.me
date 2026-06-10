import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  fetchCategories,
  fetchProducts,
  fetchSettings,
  fetchActiveOrders,
  fetchTodayAnalytics,
  placeOrder as apiPlaceOrder,
  updateOrderStatus as apiUpdateOrderStatus,
  adminUpsertCategory,
  adminDeleteCategory,
  adminReorderCategories,
  adminUpsertProduct,
  adminDeleteProduct,
  adminReorderProducts,
  adminUpdateSettings,
  priceFor,
  formatCurrency,
} from "../lib/api";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase";
import { getAdminSession, getEmployeeSession } from "../lib/auth";
import type {
  Analytics,
  CartItem,
  Category,
  DiningMode,
  Order,
  OrderStatus,
  Product,
  Settings,
} from "../lib/types";

export type { Category, Product, Order, CartItem, DiningMode, OrderStatus, Settings, Analytics };
export { priceFor, formatCurrency as formatNOK };

type StoreState = {
  categories: Category[];
  products: Product[];
  orders: Order[];
  settings: Settings | null;
  analytics: Analytics | null;
};

type Ctx = {
  loading: boolean;
  error: string | null;
  configured: boolean;
  state: StoreState;
  refresh: () => Promise<void>;
  placeOrder: (
    customerName: string,
    mode: DiningMode,
    cart: CartItem[]
  ) => Promise<{ order_number: number; customer_name: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  upsertProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reorderProducts: (ids: string[]) => Promise<void>;
  upsertCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (ids: string[]) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
};

const StoreContext = createContext<Ctx | null>(null);

const emptyState: StoreState = {
  categories: [],
  products: [],
  orders: [],
  settings: null,
  analytics: null,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<StoreState>(emptyState);
  const configured = isSupabaseConfigured();

  const loadData = useCallback(async () => {
    if (!configured) {
      setError("Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [categories, products, settings] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchSettings(),
      ]);

      let orders: Order[] = [];
      let analytics: Analytics | null = null;

      const employeeSession = getEmployeeSession();
      const adminSession = getAdminSession();
      if (employeeSession || adminSession) {
        orders = await fetchActiveOrders();
      }
      if (adminSession) {
        analytics = await fetchTodayAnalytics();
      }

      setState({ categories, products, orders, settings, analytics });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabase();
    const channels: RealtimeChannel[] = [];

    const ordersChannel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async () => {
        if (getEmployeeSession() || getAdminSession()) {
          try {
            const orders = await fetchActiveOrders();
            setState((s) => ({ ...s, orders }));
          } catch {
            /* ignore transient errors */
          }
        }
      })
      .subscribe();
    channels.push(ordersChannel);

    const menuChannel = supabase
      .channel("menu-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
        try {
          const products = await fetchProducts();
          setState((s) => ({ ...s, products }));
        } catch {
          /* ignore */
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, async () => {
        try {
          const categories = await fetchCategories();
          setState((s) => ({ ...s, categories }));
        } catch {
          /* ignore */
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, async () => {
        try {
          const settings = await fetchSettings();
          setState((s) => ({ ...s, settings }));
        } catch {
          /* ignore */
        }
      })
      .subscribe();
    channels.push(menuChannel);

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [configured]);

  const placeOrder = useCallback(
    async (customerName: string, mode: DiningMode, cart: CartItem[]) => {
      const result = await apiPlaceOrder(customerName, mode, cart);
      return result;
    },
    []
  );

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const session = getEmployeeSession();
    if (!session) throw new Error("Not authenticated");
    await apiUpdateOrderStatus(session.token, orderId, status);
    const orders = await fetchActiveOrders();
    setState((s) => ({ ...s, orders }));
  }, []);

  const upsertProduct = useCallback(async (product: Product) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    await adminUpsertProduct(session.token, product);
    const products = await fetchProducts();
    setState((s) => ({ ...s, products }));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    await adminDeleteProduct(session.token, id);
    const products = await fetchProducts();
    setState((s) => ({ ...s, products }));
  }, []);

  const reorderProducts = useCallback(async (ids: string[]) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    await adminReorderProducts(session.token, ids);
    const products = await fetchProducts();
    setState((s) => ({ ...s, products }));
  }, []);

  const upsertCategory = useCallback(async (category: Category) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    await adminUpsertCategory(session.token, category);
    const categories = await fetchCategories();
    setState((s) => ({ ...s, categories }));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    await adminDeleteCategory(session.token, id);
    const [categories, products] = await Promise.all([fetchCategories(), fetchProducts()]);
    setState((s) => ({ ...s, categories, products }));
  }, []);

  const reorderCategories = useCallback(async (ids: string[]) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    await adminReorderCategories(session.token, ids);
    const categories = await fetchCategories();
    setState((s) => ({ ...s, categories }));
  }, []);

  const updateSettings = useCallback(async (settings: Partial<Settings>) => {
    const session = getAdminSession();
    if (!session) throw new Error("Not authenticated");
    const updated = await adminUpdateSettings(session.token, settings);
    setState((s) => ({ ...s, settings: updated }));
  }, []);

  const refreshAnalytics = useCallback(async () => {
    const analytics = await fetchTodayAnalytics();
    setState((s) => ({ ...s, analytics }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      error,
      configured,
      state,
      refresh: loadData,
      placeOrder,
      updateOrderStatus,
      upsertProduct,
      deleteProduct,
      reorderProducts,
      upsertCategory,
      deleteCategory,
      reorderCategories,
      updateSettings,
      refreshAnalytics,
    }),
    [
      loading,
      error,
      configured,
      state,
      loadData,
      placeOrder,
      updateOrderStatus,
      upsertProduct,
      deleteProduct,
      reorderProducts,
      upsertCategory,
      deleteCategory,
      reorderCategories,
      updateSettings,
      refreshAnalytics,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
