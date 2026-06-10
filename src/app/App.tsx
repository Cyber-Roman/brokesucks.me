import { useEffect, useState } from "react";
import { StoreProvider } from "./store";
import { CustomerPage } from "./pages/CustomerPage";
import { OrderPage } from "./pages/OrderPage";
import { AdminPage } from "./pages/AdminPage";
import { ConfigBanner } from "./components/ConfigBanner";
import { Users, ChefHat, Settings } from "lucide-react";

type Route = "customers" | "order" | "admin";

function getRoute(): Route {
  const h = (typeof window !== "undefined" ? window.location.hash : "")
    .replace("#/", "")
    .replace("#", "");
  if (h === "order") return "order";
  if (h === "admin") return "admin";
  return "customers";
}

const showDevNav = import.meta.env.VITE_SHOW_DEV_NAV === "true";

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const nav = (r: Route) => {
    window.location.hash = `#/${r}`;
    setRoute(r);
  };

  return (
    <StoreProvider>
      <style>{`
        :root {
          --bakery-yellow: #E8C15A;
          --bakery-yellow-dark: #C9A23F;
          --bakery-brown: #3D2A1E;
          --bakery-brown-soft: #8B6F5C;
          --bakery-beige: #F6EFE2;
        }
        body { background: var(--bakery-beige); color: var(--bakery-brown); }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <ConfigBanner />

      <div className="min-h-screen size-full">
        {route === "customers" && <CustomerPage />}
        {route === "order" && <OrderPage />}
        {route === "admin" && <AdminPage />}

        {showDevNav && (
          <div
            className="fixed bottom-4 right-4 z-[60] flex gap-1 p-1 rounded-2xl"
            style={{
              background: "rgba(61,42,30,0.92)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            <SwitchBtn
              icon={<Users className="w-4 h-4" />}
              label="Customers"
              active={route === "customers"}
              onClick={() => nav("customers")}
            />
            <SwitchBtn
              icon={<ChefHat className="w-4 h-4" />}
              label="Order"
              active={route === "order"}
              onClick={() => nav("order")}
            />
            <SwitchBtn
              icon={<Settings className="w-4 h-4" />}
              label="Admin"
              active={route === "admin"}
              onClick={() => nav("admin")}
            />
          </div>
        )}
      </div>
    </StoreProvider>
  );
}

function SwitchBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
      style={{
        background: active ? "var(--bakery-yellow)" : "transparent",
        color: active ? "var(--bakery-brown)" : "rgba(255,255,255,0.85)",
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
