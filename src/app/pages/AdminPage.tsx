import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "motion/react";
import {
  Edit2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  DollarSign,
  Star,
  Clock,
  Upload,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useStore, formatNOK, Product, Category } from "../store";
import { LoginScreen } from "./OrderPage";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getAdminSession, loginAdmin, logoutAdmin } from "../../lib/auth";
import { uploadProductImage } from "../../lib/api";

export function AdminPage() {
  const {
    state,
    upsertProduct,
    deleteProduct,
    upsertCategory,
    deleteCategory,
    reorderCategories,
    reorderProducts,
    refresh,
    refreshAnalytics,
  } = useStore();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "products" | "categories">("dashboard");
  const [editing, setEditing] = useState<Product | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const session = getAdminSession();
    setAuthed(!!session);
    if (session) {
      refresh();
      refreshAnalytics();
    }
  }, [refresh, refreshAnalytics]);

  const handleLogin = async () => {
    setLoggingIn(true);
    setErr("");
    try {
      await loginAdmin(pin, pass);
      setAuthed(true);
      await refresh();
      await refreshAnalytics();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid PIN or password");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAuthed(false);
    setPin("");
    setPass("");
  };

  if (!authed) {
    return (
      <LoginScreen
        title="Administrator Login"
        subtitle="Manage menu, categories and analytics"
        pin={pin}
        pass={pass}
        err={err}
        loading={loggingIn}
        setPin={setPin}
        setPass={setPass}
        onSubmit={handleLogin}
      />
    );
  }

  const sortedCats = [...state.categories].sort((a, b) => a.display_order - b.display_order);
  const markup = state.settings?.sit_here_markup ?? 10;

  return (
    <div className="min-h-screen" style={{ background: "var(--bakery-beige)" }}>
      <header className="px-10 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
            Admin Console
          </h1>
          <p style={{ color: "var(--bakery-brown-soft)" }}>
            {state.settings?.store_name ?? "Nordic Bakery"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-3 rounded-xl"
          style={{ background: "#ffffff", color: "var(--bakery-brown)", fontWeight: 600 }}
        >
          Logout
        </button>
      </header>

      <div className="px-10 flex gap-2 mb-6">
        {(["dashboard", "products", "categories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              if (t === "dashboard") refreshAnalytics();
            }}
            className="px-6 py-3 rounded-2xl transition-all"
            style={{
              background: tab === t ? "var(--bakery-brown)" : "#ffffff",
              color: tab === t ? "var(--bakery-yellow)" : "var(--bakery-brown)",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {saveError && (
        <div className="px-10 pb-2" style={{ color: "#c0392b" }}>
          {saveError}
        </div>
      )}

      <div className="px-10 pb-12">
        {tab === "dashboard" && <Dashboard analytics={state.analytics} />}
        {tab === "products" && (
          <Products
            markup={markup}
            onEdit={(p) => setEditing(p)}
            onNew={() =>
              setEditing(blankProduct(sortedCats[0]?.id ?? "", markup, state.products.length))
            }
            onReorder={async (ids) => {
              try {
                setSaveError("");
                await reorderProducts(ids);
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Failed to reorder");
              }
            }}
          />
        )}
        {tab === "categories" && (
          <Categories
            categories={sortedCats}
            onMove={async (id, dir) => {
              const idx = sortedCats.findIndex((c) => c.id === id);
              const target = idx + dir;
              if (target < 0 || target >= sortedCats.length) return;
              const ids = sortedCats.map((c) => c.id);
              [ids[idx], ids[target]] = [ids[target], ids[idx]];
              try {
                setSaveError("");
                await reorderCategories(ids);
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Failed to reorder");
              }
            }}
            onAdd={async (name) => {
              try {
                setSaveError("");
                await upsertCategory({
                  id: "",
                  name,
                  display_order: sortedCats.length,
                  created_at: new Date().toISOString(),
                });
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Failed to add category");
              }
            }}
            onRename={async (c) => {
              try {
                setSaveError("");
                await upsertCategory(c);
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Failed to rename");
              }
            }}
            onDelete={async (id) => {
              try {
                setSaveError("");
                await deleteCategory(id);
              } catch (e) {
                setSaveError(e instanceof Error ? e.message : "Failed to delete");
              }
            }}
          />
        )}
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          categories={sortedCats}
          markup={markup}
          onClose={() => setEditing(null)}
          onSave={async (p) => {
            try {
              setSaveError("");
              if (!p.name.trim()) {
                setSaveError("Product name is required");
                return;
              }
              await upsertProduct(p);
              setEditing(null);
            } catch (e) {
              setSaveError(e instanceof Error ? e.message : "Failed to save product");
            }
          }}
          onDelete={async (id) => {
            try {
              setSaveError("");
              await deleteProduct(id);
              setEditing(null);
            } catch (e) {
              setSaveError(e instanceof Error ? e.message : "Failed to delete product");
            }
          }}
        />
      )}
    </div>
  );
}

function blankProduct(categoryId: string, markup: number, order: number): Product {
  return {
    id: "",
    name: "",
    category_id: categoryId,
    description: "",
    image_url:
      "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?q=80&w=800",
    sit_here_price: markup,
    takeaway_price: 0,
    is_available: true,
    display_order: order,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function Dashboard({ analytics }: { analytics: import("../store").Analytics | null }) {
  const topProduct = analytics?.popular_products?.[0];
  const topCat = analytics?.popular_categories?.[0];
  const topList = analytics?.popular_products?.slice(0, 5) ?? [];

  const chartData = useMemo(() => {
    const hours: Record<string, number> = {};
    for (let h = 7; h <= 20; h++) hours[`${String(h).padStart(2, "0")}:00`] = 0;
    if (analytics?.peak_hours) {
      Object.entries(analytics.peak_hours).forEach(([hour, count]) => {
        hours[hour] = count;
      });
    }
    return Object.entries(hours).map(([hour, orders]) => ({ hour, orders }));
  }, [analytics]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-5">
        <StatCard
          label="Orders Today"
          value={String(analytics?.daily_orders ?? 0)}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          label="Revenue Today"
          value={formatNOK(analytics?.daily_revenue ?? 0)}
          icon={<DollarSign className="w-6 h-6" />}
          accent
        />
        <StatCard
          label="Top Product"
          value={topProduct?.name ?? "—"}
          icon={<Star className="w-6 h-6" />}
          sub={topProduct ? `${topProduct.count} sold` : ""}
        />
        <StatCard
          label="Top Category"
          value={topCat?.name ?? "—"}
          icon={<TrendingUp className="w-6 h-6" />}
          sub={topCat ? `${topCat.count} items` : ""}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 rounded-3xl p-6" style={{ background: "#ffffff" }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" style={{ color: "var(--bakery-brown)" }} />
            <div style={{ fontWeight: 700, color: "var(--bakery-brown)", fontSize: "1.125rem" }}>
              Peak Ordering Times — Today
            </div>
          </div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,40,20,0.08)" />
                <XAxis dataKey="hour" stroke="#7a5a3a" />
                <YAxis stroke="#7a5a3a" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 6px 24px rgba(60,40,20,0.15)",
                  }}
                />
                <Bar dataKey="orders" fill="var(--bakery-yellow)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "#ffffff" }}>
          <div
            style={{ fontWeight: 700, color: "var(--bakery-brown)", fontSize: "1.125rem", marginBottom: 16 }}
          >
            Most Ordered
          </div>
          {topList.length === 0 ? (
            <div style={{ color: "var(--bakery-brown-soft)" }}>No data yet today.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {topList.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: "var(--bakery-yellow)",
                      color: "var(--bakery-brown)",
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1" style={{ color: "var(--bakery-brown)", fontWeight: 600 }}>
                    {item.name}
                  </div>
                  <div style={{ color: "var(--bakery-brown-soft)" }}>{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string;
  value: string;
  icon: JSX.Element;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-3xl p-6" style={{ background: accent ? "var(--bakery-yellow)" : "#ffffff" }}>
      <div className="flex items-center justify-between mb-3" style={{ color: "var(--bakery-brown)" }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {icon}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--bakery-brown)" }}>{value}</div>
      {sub && <div style={{ color: "var(--bakery-brown-soft)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Products({
  markup,
  onEdit,
  onNew,
  onReorder,
}: {
  markup: number;
  onEdit: (p: Product) => void;
  onNew: () => void;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const { state, upsertProduct } = useStore();
  const [filter, setFilter] = useState<string>("");

  const list = useMemo(() => {
    const filtered = state.products.filter((p) => !filter || p.category_id === filter);
    return [...filtered].sort((a, b) => a.display_order - b.display_order);
  }, [state.products, filter]);

  const moveProduct = async (id: string, dir: 1 | -1) => {
    const idx = list.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const ids = list.map((p) => p.id);
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    await onReorder(ids);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <FilterChip active={!filter} onClick={() => setFilter("")} label="All" />
          {[...state.categories]
            .sort((a, b) => a.display_order - b.display_order)
            .map((c) => (
              <FilterChip
                key={c.id}
                active={filter === c.id}
                onClick={() => setFilter(c.id)}
                label={c.name}
              />
            ))}
        </div>
        <button
          onClick={onNew}
          className="px-5 py-3 rounded-xl flex items-center gap-2"
          style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)", fontWeight: 700 }}
        >
          <Plus className="w-5 h-5" /> New Product
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: "#ffffff" }}>
        <div
          className="grid grid-cols-12 px-6 py-4 border-b"
          style={{
            borderColor: "rgba(60,40,20,0.06)",
            color: "var(--bakery-brown-soft)",
            fontWeight: 600,
          }}
        >
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Takeaway / Sit Here</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {list.map((p) => {
          const cat = state.categories.find((c) => c.id === p.category_id);
          return (
            <div
              key={p.id}
              className="grid grid-cols-12 px-6 py-4 items-center border-b"
              style={{ borderColor: "rgba(60,40,20,0.04)" }}
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <ImageWithFallback
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div style={{ color: "var(--bakery-brown)", fontWeight: 600 }}>
                    {p.name || "(unnamed)"}
                  </div>
                  <div className="line-clamp-1" style={{ color: "var(--bakery-brown-soft)" }}>
                    {p.description}
                  </div>
                </div>
              </div>
              <div className="col-span-2" style={{ color: "var(--bakery-brown)" }}>
                {cat?.name ?? "—"}
              </div>
              <div className="col-span-2" style={{ color: "var(--bakery-brown)" }}>
                {formatNOK(p.takeaway_price)} / {formatNOK(p.sit_here_price)}
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await upsertProduct({ ...p, is_available: !p.is_available });
                    } catch {
                      /* error shown via saveError in parent */
                    }
                  }}
                  className="px-3 py-1.5 rounded-full flex items-center gap-1"
                  style={{
                    background: p.is_available ? "var(--bakery-beige)" : "rgba(192,57,43,0.1)",
                    color: p.is_available ? "var(--bakery-brown)" : "#c0392b",
                  }}
                >
                  {p.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {p.is_available ? "Available" : "Hidden"}
                </button>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button
                  onClick={() => moveProduct(p.id, -1)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)" }}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveProduct(p.id, 1)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)" }}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)" }}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="py-16 text-center" style={{ color: "var(--bakery-brown-soft)" }}>
            No products. Click "New Product" to add one.
          </div>
        )}
      </div>
      <div style={{ color: "var(--bakery-brown-soft)" }}>
        Sit-here default markup: {markup} kr (configurable in settings table)
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full"
      style={{
        background: active ? "var(--bakery-brown)" : "#ffffff",
        color: active ? "var(--bakery-yellow)" : "var(--bakery-brown)",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

function ProductEditor({
  product,
  categories,
  markup,
  onClose,
  onSave,
  onDelete,
}: {
  product: Product;
  categories: Category[];
  markup: number;
  onClose: () => void;
  onSave: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [p, setP] = useState<Product>(product);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleTakeawayChange = (value: number) => {
    setP({ ...p, takeaway_price: value, sit_here_price: value + markup });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadProductImage(file);
      setP({ ...p, image_url: url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(60,40,20,0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: "#ffffff" }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
          {product.name ? "Edit Product" : "New Product"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Field label="Name">
            <input
              value={p.name}
              onChange={(e) => setP({ ...p, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "var(--bakery-beige)" }}
            />
          </Field>
          <Field label="Category">
            <select
              value={p.category_id}
              onChange={(e) => setP({ ...p, category_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "var(--bakery-beige)" }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" className="col-span-2">
            <textarea
              value={p.description}
              onChange={(e) => setP({ ...p, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none min-h-24"
              style={{ background: "var(--bakery-beige)" }}
            />
          </Field>
          <Field label="Image URL" className="col-span-2">
            <input
              value={p.image_url}
              onChange={(e) => setP({ ...p, image_url: e.target.value })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "var(--bakery-beige)" }}
            />
          </Field>
          <Field label="Upload Image" className="col-span-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)", fontWeight: 600 }}
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading…" : "Choose file"}
            </button>
            {uploadError && <div style={{ color: "#c0392b", marginTop: 4 }}>{uploadError}</div>}
            {p.image_url && (
              <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden">
                <ImageWithFallback src={p.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </Field>
          <Field label="Takeaway Price (NOK)">
            <input
              type="number"
              value={p.takeaway_price}
              onChange={(e) => handleTakeawayChange(Number(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "var(--bakery-beige)" }}
            />
          </Field>
          <Field label="Sit-Here Price (NOK)">
            <input
              type="number"
              value={p.sit_here_price}
              onChange={(e) => setP({ ...p, sit_here_price: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: "var(--bakery-beige)" }}
            />
          </Field>
        </div>

        <div className="flex gap-4 mt-6">
          <Toggle
            label="Available on menu"
            value={p.is_available}
            onChange={(v) => setP({ ...p, is_available: v })}
          />
        </div>

        <div className="flex justify-between mt-8">
          {product.id ? (
            <button
              onClick={() => onDelete(p.id)}
              className="px-5 py-3 rounded-xl flex items-center gap-2"
              style={{ background: "rgba(192,57,43,0.1)", color: "#c0392b", fontWeight: 600 }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl"
              style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)", fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(p)}
              className="px-6 py-3 rounded-xl"
              style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)", fontWeight: 700 }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div style={{ color: "var(--bakery-brown)", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "var(--bakery-beige)" }}
    >
      <div
        className="w-10 h-6 rounded-full relative transition-all"
        style={{ background: value ? "var(--bakery-yellow)" : "rgba(60,40,20,0.2)" }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
          style={{ background: "#fff", left: value ? "calc(100% - 22px)" : "2px" }}
        />
      </div>
      <span style={{ color: "var(--bakery-brown)", fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function Categories({
  categories,
  onMove,
  onAdd,
  onRename,
  onDelete,
}: {
  categories: Category[];
  onMove: (id: string, dir: 1 | -1) => void;
  onAdd: (name: string) => void;
  onRename: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl p-6 flex gap-3" style={{ background: "#ffffff" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 px-4 py-3 rounded-xl outline-none"
          style={{ background: "var(--bakery-beige)" }}
        />
        <button
          onClick={() => {
            if (newName.trim()) {
              onAdd(newName.trim());
              setNewName("");
            }
          }}
          className="px-5 py-3 rounded-xl flex items-center gap-2"
          style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)", fontWeight: 700 }}
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden" style={{ background: "#ffffff" }}>
        {categories.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-6 py-4 border-b"
            style={{ borderColor: "rgba(60,40,20,0.06)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: "var(--bakery-yellow)",
                color: "var(--bakery-brown)",
                fontWeight: 700,
              }}
            >
              {i + 1}
            </div>
            <input
              defaultValue={c.name}
              onBlur={(e) => e.target.value !== c.name && onRename({ ...c, name: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg outline-none"
              style={{ background: "transparent", color: "var(--bakery-brown)", fontWeight: 600 }}
            />
            <button
              onClick={() => onMove(c.id, -1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)" }}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMove(c.id, 1)}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)" }}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(192,57,43,0.1)", color: "#c0392b" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div style={{ color: "var(--bakery-brown-soft)" }}>
        Changes apply instantly to the customer kiosk. Deleting a category also removes its products.
      </div>
    </div>
  );
}
