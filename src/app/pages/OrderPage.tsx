import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, Lock, ShoppingBag, ChefHat, Package } from "lucide-react";
import { useStore, formatNOK, Order, OrderStatus } from "../store";
import {
  getEmployeeSession,
  loginEmployee,
  logoutEmployee,
} from "../../lib/auth";
import { orderTypeToDiningMode } from "../../lib/types";

function timeAgo(t: string) {
  const diff = Math.floor((Date.now() - new Date(t).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatClock(t: string) {
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OrderPage() {
  const { state, updateOrderStatus, refresh } = useStore();
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<"new" | "ready">("new");
  const [actionError, setActionError] = useState("");
  const [, force] = useState(0);

  useEffect(() => {
    const session = getEmployeeSession();
    setAuthed(!!session);
    if (session) {
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const newOrders = useMemo(
    () =>
      state.orders
        .filter((o) => o.status === "new" || o.status === "preparing")
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [state.orders]
  );

  const readyOrders = useMemo(
    () =>
      state.orders
        .filter((o) => o.status === "ready")
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
    [state.orders]
  );

  const handleLogin = async () => {
    setLoggingIn(true);
    setErr("");
    try {
      await loginEmployee(pin, pass);
      setAuthed(true);
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invalid PIN or password");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleStatus = async (orderId: string, status: OrderStatus) => {
    setActionError("");
    try {
      await updateOrderStatus(orderId, status);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update order");
    }
  };

  const handleLogout = async () => {
    await logoutEmployee();
    setAuthed(false);
    setPin("");
    setPass("");
  };

  if (!authed) {
    return (
      <LoginScreen
        title="Employee Login"
        subtitle="Enter your PIN and password to access orders"
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bakery-beige)" }}>
      <header className="px-10 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
            Kitchen Dashboard
          </h1>
          <p style={{ color: "var(--bakery-brown-soft)" }}>Real-time order queue</p>
        </div>
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{ background: "#ffffff", boxShadow: "0 2px 8px rgba(60,40,20,0.06)" }}
        >
          <TabButton active={tab === "new"} onClick={() => setTab("new")} count={newOrders.length} label="NEW" />
          <TabButton
            active={tab === "ready"}
            onClick={() => setTab("ready")}
            count={readyOrders.length}
            label="READY"
          />
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-3 rounded-xl"
          style={{ background: "#ffffff", color: "var(--bakery-brown)", fontWeight: 600 }}
        >
          Logout
        </button>
      </header>

      {actionError && (
        <div className="px-10 pb-2" style={{ color: "#c0392b" }}>
          {actionError}
        </div>
      )}

      <div className="px-10 pb-10">
        {tab === "new" ? (
          newOrders.length === 0 ? (
            <EmptyState text="No new orders. They will appear here instantly." />
          ) : (
            <div className="grid grid-cols-3 gap-5">
              <AnimatePresence>
                {newOrders.map((o) => (
                  <OrderCard key={o.id} o={o} onStatus={handleStatus} />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : readyOrders.length === 0 ? (
          <EmptyState text="No ready orders yet." />
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {readyOrders.map((o) => (
              <OrderCard key={o.id} o={o} onStatus={handleStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  label,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
      style={{
        background: active ? "var(--bakery-brown)" : "transparent",
        color: active ? "var(--bakery-yellow)" : "var(--bakery-brown)",
        fontWeight: 700,
      }}
    >
      {label}
      <span
        className="px-2 py-0.5 rounded-full"
        style={{
          background: active ? "var(--bakery-yellow)" : "var(--bakery-beige)",
          color: "var(--bakery-brown)",
          fontSize: "0.85rem",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function OrderCard({
  o,
  onStatus,
}: {
  o: Order;
  onStatus: (id: string, status: OrderStatus) => void;
}) {
  const mode = orderTypeToDiningMode(o.order_type);
  const items = o.items ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-3xl p-6 flex flex-col gap-3"
      style={{ background: "#ffffff", boxShadow: "0 4px 16px rgba(60,40,20,0.08)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
            #{o.order_number}
          </div>
          <div style={{ color: "var(--bakery-brown)", fontWeight: 600, fontSize: "1.125rem" }}>
            {o.customer_name}
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{
            background: mode === "sit" ? "var(--bakery-yellow)" : "var(--bakery-beige)",
            color: "var(--bakery-brown)",
            fontWeight: 600,
          }}
        >
          {mode === "sit" ? "🪑 Sit here" : "🥡 Takeaway"}
        </div>
      </div>

      <div className="flex items-center gap-2" style={{ color: "var(--bakery-brown-soft)" }}>
        <Clock className="w-4 h-4" />
        <span>
          {formatClock(o.created_at)} • {timeAgo(o.created_at)}
        </span>
        {o.status === "preparing" && (
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)" }}>
            Preparing
          </span>
        )}
      </div>

      <div className="border-t pt-3 flex flex-col gap-1.5" style={{ borderColor: "rgba(60,40,20,0.08)" }}>
        {items.map((it) => (
          <div key={it.id} className="flex justify-between">
            <div style={{ color: "var(--bakery-brown)" }}>
              <span style={{ fontWeight: 700, marginRight: 8 }}>{it.quantity}×</span>
              {it.product_name_snapshot}
            </div>
            <div style={{ color: "var(--bakery-brown-soft)" }}>
              {formatNOK(it.price * it.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex justify-between items-center pt-2 border-t"
        style={{ borderColor: "rgba(60,40,20,0.08)" }}
      >
        <div style={{ color: "var(--bakery-brown-soft)" }}>Total</div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
          {formatNOK(o.total_price)}
        </div>
      </div>

      {o.status === "new" && (
        <button
          onClick={() => onStatus(o.id, "preparing")}
          className="w-full py-4 rounded-2xl mt-2 flex items-center justify-center gap-2"
          style={{
            background: "var(--bakery-beige)",
            color: "var(--bakery-brown)",
            fontWeight: 700,
            fontSize: "1.125rem",
          }}
        >
          <ChefHat className="w-5 h-5" />
          Prepare
        </button>
      )}

      {(o.status === "new" || o.status === "preparing") && (
        <button
          onClick={() => onStatus(o.id, "ready")}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
          style={{
            background: "var(--bakery-yellow)",
            color: "var(--bakery-brown)",
            fontWeight: 700,
            fontSize: "1.125rem",
            boxShadow: "0 6px 18px rgba(232,193,90,0.4)",
          }}
        >
          <CheckCircle2 className="w-5 h-5" />
          Mark Ready
        </button>
      )}

      {o.status === "ready" && (
        <button
          onClick={() => onStatus(o.id, "completed")}
          className="w-full py-4 rounded-2xl mt-2 flex items-center justify-center gap-2"
          style={{
            background: "var(--bakery-brown)",
            color: "var(--bakery-yellow)",
            fontWeight: 700,
            fontSize: "1.125rem",
          }}
        >
          <Package className="w-5 h-5" />
          Complete
        </button>
      )}
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl p-20 text-center" style={{ background: "#ffffff" }}>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "var(--bakery-beige)" }}
      >
        <ShoppingBag className="w-10 h-10" style={{ color: "var(--bakery-brown-soft)" }} />
      </div>
      <div style={{ color: "var(--bakery-brown-soft)", fontSize: "1.125rem" }}>{text}</div>
    </div>
  );
}

export function LoginScreen({
  title,
  subtitle,
  pin,
  pass,
  err,
  loading,
  setPin,
  setPass,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  pin: string;
  pass: string;
  err: string;
  loading?: boolean;
  setPin: (s: string) => void;
  setPass: (s: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ background: "var(--bakery-beige)" }}
    >
      <div
        className="rounded-3xl p-10 w-full max-w-md"
        style={{ background: "#ffffff", boxShadow: "0 12px 40px rgba(60,40,20,0.1)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "var(--bakery-yellow)" }}
        >
          <Lock className="w-8 h-8" style={{ color: "var(--bakery-brown)" }} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--bakery-brown)" }}>{title}</h1>
        <p style={{ color: "var(--bakery-brown-soft)", marginTop: 6 }}>{subtitle}</p>

        <label className="block mt-6" style={{ color: "var(--bakery-brown)", fontWeight: 600 }}>
          PIN
        </label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          type="password"
          placeholder="••••••"
          disabled={loading}
          className="w-full mt-2 px-5 py-4 rounded-xl outline-none"
          style={{
            background: "var(--bakery-beige)",
            color: "var(--bakery-brown)",
            fontSize: "1.125rem",
            letterSpacing: "0.3em",
          }}
        />

        <label className="block mt-4" style={{ color: "var(--bakery-brown)", fontWeight: 600 }}>
          Password
        </label>
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          placeholder="••••••••"
          disabled={loading}
          className="w-full mt-2 px-5 py-4 rounded-xl outline-none"
          style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)", fontSize: "1.125rem" }}
          onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
        />

        {err && (
          <div className="mt-3" style={{ color: "#c0392b" }}>
            {err}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full mt-6 py-4 rounded-xl"
          style={{
            background: loading ? "rgba(60,40,20,0.15)" : "var(--bakery-yellow)",
            color: "var(--bakery-brown)",
            fontWeight: 700,
            fontSize: "1.125rem",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}
