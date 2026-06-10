import { AlertCircle, RefreshCw } from "lucide-react";
import { useStore } from "../store";

export function ConfigBanner() {
  const { loading, error, configured, refresh } = useStore();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "var(--bakery-beige)" }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--bakery-yellow)", borderTopColor: "transparent" }}
          />
          <div style={{ color: "var(--bakery-brown)", fontWeight: 600, fontSize: "1.125rem" }}>
            Loading bakery menu…
          </div>
        </div>
      </div>
    );
  }

  if (!configured || error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-8" style={{ background: "var(--bakery-beige)" }}>
        <div className="rounded-3xl p-10 max-w-lg w-full text-center" style={{ background: "#ffffff" }}>
          <AlertCircle className="w-14 h-14 mx-auto mb-4" style={{ color: "#c0392b" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--bakery-brown)" }}>
            {!configured ? "Supabase Not Configured" : "Connection Error"}
          </h1>
          <p style={{ color: "var(--bakery-brown-soft)", marginTop: 12 }}>
            {!configured
              ? "Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run the SQL migrations in supabase/migrations/."
              : error}
          </p>
          {configured && (
            <button
              onClick={() => refresh()}
              className="mt-6 px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
              style={{ background: "var(--bakery-yellow)", color: "var(--bakery-brown)", fontWeight: 700 }}
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
