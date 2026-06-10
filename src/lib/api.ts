import { getSupabase, getErrorMessage } from "./supabase";
import type {
  Analytics,
  CartItem,
  Category,
  DiningMode,
  Order,
  OrderStatus,
  Product,
  Settings,
} from "./types";
import { diningModeToOrderType } from "./types";

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(getErrorMessage(error));
  return data ?? [];
}

export async function fetchProducts(): Promise<Product[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw new Error(getErrorMessage(error));
  return (data ?? []).map((p) => ({
    ...p,
    sit_here_price: Number(p.sit_here_price),
    takeaway_price: Number(p.takeaway_price),
  }));
}

export async function fetchSettings(): Promise<Settings> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("settings").select("*").limit(1).single();
  if (error) throw new Error(getErrorMessage(error));
  return {
    ...data,
    sit_here_markup: Number(data.sit_here_markup),
  };
}

export async function fetchActiveOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_active_orders");
  if (error) throw new Error(getErrorMessage(error));
  const orders = (data ?? []) as Order[];
  return orders.map((o) => ({
    ...o,
    order_number: Number(o.order_number),
    total_price: Number(o.total_price),
    items: (o.items ?? []).map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      price: Number(i.price),
    })),
  }));
}

export async function placeOrder(
  customerName: string,
  mode: DiningMode,
  cart: CartItem[]
): Promise<{ order_number: number; customer_name: string }> {
  const supabase = getSupabase();
  const items = cart.map((c) => ({
    product_id: c.productId,
    quantity: c.qty,
  }));
  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: customerName,
    p_order_type: diningModeToOrderType(mode),
    p_items: items,
  });
  if (error) throw new Error(getErrorMessage(error));
  return data as { order_number: number; customer_name: string };
}

export async function updateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("update_order_status", {
    p_token: token,
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw new Error(getErrorMessage(error));
}

export async function fetchTodayAnalytics(): Promise<Analytics> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_today_analytics");
  if (error) throw new Error(getErrorMessage(error));
  const row = data as Analytics;
  return {
    date: row.date,
    daily_orders: Number(row.daily_orders),
    daily_revenue: Number(row.daily_revenue),
    popular_products: row.popular_products ?? [],
    popular_categories: row.popular_categories ?? [],
    peak_hours: row.peak_hours ?? {},
  };
}

// Admin API
export async function adminUpsertCategory(
  token: string,
  category: { id?: string; name: string; display_order: number }
): Promise<Category> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("admin_upsert_category", {
    p_token: token,
    p_id: category.id && category.id.length > 0 ? category.id : null,
    p_name: category.name,
    p_display_order: category.display_order,
  });
  if (error) throw new Error(getErrorMessage(error));
  return data as Category;
}

export async function adminDeleteCategory(token: string, id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_delete_category", {
    p_token: token,
    p_id: id,
  });
  if (error) throw new Error(getErrorMessage(error));
}

export async function adminReorderCategories(token: string, ids: string[]): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_reorder_categories", {
    p_token: token,
    p_ids: ids,
  });
  if (error) throw new Error(getErrorMessage(error));
}

export async function adminUpsertProduct(
  token: string,
  product: {
    id?: string;
    name: string;
    description: string;
    image_url: string;
    category_id: string;
    sit_here_price: number;
    takeaway_price: number;
    is_available: boolean;
    display_order: number;
  }
): Promise<Product> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("admin_upsert_product", {
    p_token: token,
    p_id: product.id && product.id.length > 0 ? product.id : null,
    p_name: product.name,
    p_description: product.description,
    p_image_url: product.image_url,
    p_category_id: product.category_id,
    p_sit_here_price: product.sit_here_price,
    p_takeaway_price: product.takeaway_price,
    p_is_available: product.is_available,
    p_display_order: product.display_order,
  });
  if (error) throw new Error(getErrorMessage(error));
  const p = data as Product;
  return {
    ...p,
    sit_here_price: Number(p.sit_here_price),
    takeaway_price: Number(p.takeaway_price),
  };
}

export async function adminDeleteProduct(token: string, id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_delete_product", {
    p_token: token,
    p_id: id,
  });
  if (error) throw new Error(getErrorMessage(error));
}

export async function adminReorderProducts(token: string, ids: string[]): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_reorder_products", {
    p_token: token,
    p_ids: ids,
  });
  if (error) throw new Error(getErrorMessage(error));
}

export async function adminUpdateSettings(
  token: string,
  settings: Partial<Pick<Settings, "store_name" | "currency" | "sit_here_markup">>
): Promise<Settings> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("admin_update_settings", {
    p_token: token,
    p_store_name: settings.store_name ?? null,
    p_currency: settings.currency ?? null,
    p_sit_here_markup: settings.sit_here_markup ?? null,
  });
  if (error) throw new Error(getErrorMessage(error));
  const s = data as Settings;
  return { ...s, sit_here_markup: Number(s.sit_here_markup) };
}

export async function uploadProductImage(file: File): Promise<string> {
  const supabase = getSupabase();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(getErrorMessage(error));
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export function priceFor(product: Product, mode: DiningMode): number {
  return mode === "sit" ? product.sit_here_price : product.takeaway_price;
}

export const formatCurrency = (amount: number, currency = "NOK") =>
  `${amount.toFixed(0)} ${currency === "NOK" ? "kr" : currency}`;
