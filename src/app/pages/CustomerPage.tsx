import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2, ChefHat, Coffee, Sandwich, Wheat, CheckCircle2 } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useStore, formatNOK, priceFor, DiningMode, CartItem, Product } from "../store";

const CAT_ICONS: Record<string, JSX.Element> = {
  Buns: <ChefHat className="w-6 h-6" />,
  Coffee: <Coffee className="w-6 h-6" />,
  Sandwiches: <Sandwich className="w-6 h-6" />,
  Bread: <Wheat className="w-6 h-6" />,
};

export function CustomerPage() {
  const { state, placeOrder } = useStore();
  const [mode, setMode] = useState<DiningMode | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCat, setActiveCat] = useState<string>("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [thankYou, setThankYou] = useState<{ name: string; number: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const storeName = state.settings?.store_name ?? "Nordic Bakery";
  const markup = state.settings?.sit_here_markup ?? 10;

  useEffect(() => {
    setMode(null);
    setCart([]);
    setCustomerName("");
    setOrderOpen(false);
    setThankYou(null);
    setSubmitError("");
  }, []);

  const sortedCats = useMemo(
    () => [...state.categories].sort((a, b) => a.display_order - b.display_order),
    [state.categories]
  );

  useEffect(() => {
    if (sortedCats.length && !activeCat) setActiveCat(sortedCats[0].id);
  }, [sortedCats, activeCat]);

  const visibleProducts = useMemo(
    () =>
      state.products
        .filter((p) => p.is_available && p.category_id === activeCat)
        .sort((a, b) => a.display_order - b.display_order),
    [state.products, activeCat]
  );

  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product) => {
    if (!mode) return;
    const unitPrice = priceFor(p, mode);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, image: p.image_url, unitPrice, qty: 1 },
      ];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const submitOrder = async () => {
    if (!mode || !customerName.trim() || cart.length === 0) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const order = await placeOrder(customerName.trim(), mode, cart);
      setThankYou({ name: order.customer_name, number: order.order_number });
      setOrderOpen(false);
      setCart([]);
      setCustomerName("");
      setTimeout(() => setThankYou(null), 4500);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bakery-beige)" }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ background: "var(--bakery-yellow)" }}
            >
              <ChefHat className="w-10 h-10" style={{ color: "var(--bakery-brown)" }} />
            </div>
            <h1
              style={{
                fontSize: "2.75rem",
                fontWeight: 700,
                color: "var(--bakery-brown)",
                letterSpacing: "-0.02em",
              }}
            >
              Welcome to {storeName}
            </h1>
            <p style={{ fontSize: "1.5rem", marginTop: "1rem", color: "var(--bakery-brown-soft)" }}>
              Where would you like to enjoy your order?
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-0 h-[60%]">
          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setMode("sit")}
            className="flex flex-col items-center justify-center gap-6 transition-shadow"
            style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)" }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.4)" }}
            >
              <Coffee className="w-14 h-14" />
            </div>
            <div style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.02em" }}>SIT HERE</div>
            <div style={{ fontSize: "1.125rem", opacity: 0.75 }}>Enjoy on our premises</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setMode("takeaway")}
            className="flex flex-col items-center justify-center gap-6"
            style={{ background: "#ffffff", color: "var(--bakery-brown)" }}
          >
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: "var(--bakery-beige)" }}
            >
              <ShoppingBag className="w-14 h-14" />
            </div>
            <div style={{ fontSize: "3rem", fontWeight: 700, letterSpacing: "-0.02em" }}>TAKEAWAY</div>
            <div style={{ fontSize: "1.125rem", opacity: 0.65 }}>
              To go — save {markup} kr per item
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex" style={{ background: "var(--bakery-beige)" }}>
      <aside
        className="w-[420px] flex flex-col"
        style={{ background: "#ffffff", boxShadow: "8px 0 32px rgba(60,40,20,0.06)" }}
      >
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag className="w-6 h-6" style={{ color: "var(--bakery-brown)" }} />
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
              Your Order
            </div>
          </div>
          <div style={{ color: "var(--bakery-brown-soft)" }}>
            {mode === "sit"
              ? `🪑 Sit here • includes ${markup} kr/item service`
              : "🥡 Takeaway"}
            <button
              onClick={() => {
                setMode(null);
                setCart([]);
              }}
              className="ml-2 underline"
              style={{ color: "var(--bakery-yellow-dark)" }}
            >
              change
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center pb-20">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
                style={{ background: "var(--bakery-beige)" }}
              >
                <ShoppingBag className="w-10 h-10" style={{ color: "var(--bakery-brown-soft)" }} />
              </div>
              <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--bakery-brown)" }}>
                Your basket is empty
              </div>
              <div style={{ color: "var(--bakery-brown-soft)", marginTop: 4 }}>Tap a product to add it</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 rounded-2xl"
                    style={{ background: "var(--bakery-beige)" }}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ fontWeight: 600, color: "var(--bakery-brown)" }}>
                        {item.name}
                      </div>
                      <div style={{ color: "var(--bakery-brown-soft)" }}>
                        {formatNOK(item.unitPrice)} each
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => changeQty(item.productId, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "#ffffff", color: "var(--bakery-brown)" }}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div
                          className="w-6 text-center"
                          style={{ fontWeight: 600, color: "var(--bakery-brown)" }}
                        >
                          {item.qty}
                        </div>
                        <button
                          onClick={() => changeQty(item.productId, +1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)" }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ color: "var(--bakery-brown-soft)" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--bakery-brown)" }}>
                      {formatNOK(item.unitPrice * item.qty)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 pt-4 border-t" style={{ borderColor: "rgba(60,40,20,0.08)" }}>
          <div className="flex justify-between items-baseline mb-4">
            <div style={{ fontSize: "1.125rem", color: "var(--bakery-brown-soft)" }}>Total</div>
            <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
              {formatNOK(total)}
            </div>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setOrderOpen(true)}
            className="w-full rounded-2xl py-6 transition-all"
            style={{
              background: cart.length === 0 ? "rgba(60,40,20,0.1)" : "var(--bakery-yellow)",
              color: cart.length === 0 ? "var(--bakery-brown-soft)" : "var(--bakery-brown)",
              fontSize: "1.5rem",
              fontWeight: 700,
              boxShadow: cart.length === 0 ? "none" : "0 8px 24px rgba(232,193,90,0.45)",
              cursor: cart.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            ORDER • {itemCount} {itemCount === 1 ? "item" : "items"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="px-10 pt-8 pb-4 flex gap-3 overflow-x-auto">
          {sortedCats.map((c) => {
            const active = c.id === activeCat;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl transition-all flex-shrink-0"
                style={{
                  background: active ? "var(--bakery-brown)" : "#ffffff",
                  color: active ? "var(--bakery-yellow)" : "var(--bakery-brown)",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  boxShadow: active
                    ? "0 8px 24px rgba(60,40,20,0.18)"
                    : "0 2px 8px rgba(60,40,20,0.05)",
                }}
              >
                {CAT_ICONS[c.name] ?? <ChefHat className="w-6 h-6" />}
                {c.name}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <div className="grid grid-cols-4 gap-6">
            {visibleProducts.map((p) => {
              const price = priceFor(p, mode);
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addToCart(p)}
                  className="rounded-3xl overflow-hidden text-left flex flex-col transition-all"
                  style={{
                    background: "#ffffff",
                    boxShadow: "0 4px 16px rgba(60,40,20,0.06)",
                    cursor: "pointer",
                  }}
                >
                  <div className="aspect-square overflow-hidden relative">
                    <ImageWithFallback
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex flex-col gap-2 flex-1">
                    <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
                      {p.name}
                    </div>
                    <div className="line-clamp-2 flex-1" style={{ color: "var(--bakery-brown-soft)" }}>
                      {p.description}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
                        {formatNOK(price)}
                      </div>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)" }}
                      >
                        <Plus className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {visibleProducts.length === 0 && (
            <div className="text-center py-20" style={{ color: "var(--bakery-brown-soft)" }}>
              No products in this category yet.
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {orderOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-8"
            style={{ background: "rgba(60,40,20,0.5)" }}
            onClick={() => !submitting && setOrderOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl p-10 w-full max-w-md"
              style={{ background: "#ffffff" }}
            >
              <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
                Please enter your name
              </h2>
              <p style={{ color: "var(--bakery-brown-soft)", marginTop: 8 }}>
                We'll call your name when your order is ready.
              </p>
              <input
                autoFocus
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                disabled={submitting}
                className="w-full mt-6 px-6 py-5 rounded-2xl outline-none"
                style={{ background: "var(--bakery-beige)", color: "var(--bakery-brown)", fontSize: "1.25rem" }}
                onKeyDown={(e) => e.key === "Enter" && submitOrder()}
              />
              {submitError && (
                <div className="mt-3" style={{ color: "#c0392b" }}>
                  {submitError}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  disabled={submitting}
                  onClick={() => setOrderOpen(false)}
                  className="flex-1 py-5 rounded-2xl"
                  style={{
                    background: "var(--bakery-beige)",
                    color: "var(--bakery-brown)",
                    fontSize: "1.125rem",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!customerName.trim() || submitting}
                  onClick={submitOrder}
                  className="flex-1 py-5 rounded-2xl"
                  style={{
                    background:
                      customerName.trim() && !submitting
                        ? "var(--bakery-yellow)"
                        : "rgba(60,40,20,0.15)",
                    color: "var(--bakery-brown)",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                  }}
                >
                  {submitting ? "Submitting…" : "Submit Order"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {thankYou && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ background: "rgba(60,40,20,0.55)" }}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="rounded-3xl p-12 text-center max-w-lg w-full"
              style={{ background: "#ffffff" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "var(--bakery-yellow)" }}
              >
                <CheckCircle2 className="w-14 h-14" style={{ color: "var(--bakery-brown)" }} />
              </motion.div>
              <div style={{ fontSize: "2.25rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
                Thank you for your order
              </div>
              <div style={{ fontSize: "1.25rem", color: "var(--bakery-brown-soft)", marginTop: 12 }}>
                {thankYou.name}, your order number is
              </div>
              <div
                style={{
                  fontSize: "4rem",
                  fontWeight: 700,
                  color: "var(--bakery-yellow-dark)",
                  marginTop: 8,
                }}
              >
                #{thankYou.number}
              </div>
              <div style={{ color: "var(--bakery-brown-soft)", marginTop: 8 }}>
                We'll prepare it right away.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
