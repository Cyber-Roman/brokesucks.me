export type OrderType = "sit_here" | "takeaway";
export type OrderStatus = "new" | "preparing" | "ready" | "completed";
export type DiningMode = "sit" | "takeaway";

export type Category = {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category_id: string;
  sit_here_price: number;
  takeaway_price: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  product_name_snapshot: string;
};

export type Order = {
  id: string;
  customer_name: string;
  order_number: number;
  order_type: OrderType;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  completed_at: string | null;
  items?: OrderItem[];
};

export type Settings = {
  id: string;
  store_name: string;
  currency: string;
  sit_here_markup: number;
  updated_at: string;
};

export type Analytics = {
  date: string;
  daily_orders: number;
  daily_revenue: number;
  popular_products: { name: string; count: number }[];
  popular_categories: { name: string; count: number }[];
  peak_hours: Record<string, number>;
};

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
};

export type StaffSession = {
  token: string;
  username: string;
  role: "employee" | "admin";
};

export function diningModeToOrderType(mode: DiningMode): OrderType {
  return mode === "sit" ? "sit_here" : "takeaway";
}

export function orderTypeToDiningMode(type: OrderType): DiningMode {
  return type === "sit_here" ? "sit" : "takeaway";
}
