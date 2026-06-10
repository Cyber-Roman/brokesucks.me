import { getSupabase, getErrorMessage } from "./supabase";
import type { StaffSession } from "./types";

const EMPLOYEE_SESSION_KEY = "bakery_employee_session";
const ADMIN_SESSION_KEY = "bakery_admin_session";

export function getEmployeeSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(EMPLOYEE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAdminSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(key: string, session: StaffSession) {
  sessionStorage.setItem(key, JSON.stringify(session));
}

export async function loginEmployee(pin: string, password: string): Promise<StaffSession> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("login_employee", {
    p_pin: pin,
    p_password: password,
  });
  if (error) throw new Error(getErrorMessage(error));
  const session = data as StaffSession;
  saveSession(EMPLOYEE_SESSION_KEY, session);
  return session;
}

export async function loginAdmin(pin: string, password: string): Promise<StaffSession> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("login_admin", {
    p_pin: pin,
    p_password: password,
  });
  if (error) throw new Error(getErrorMessage(error));
  const session = data as StaffSession;
  saveSession(ADMIN_SESSION_KEY, session);
  return session;
}

export async function logoutEmployee(): Promise<void> {
  const session = getEmployeeSession();
  if (session?.token) {
    const supabase = getSupabase();
    await supabase.rpc("logout_staff", { p_token: session.token });
  }
  sessionStorage.removeItem(EMPLOYEE_SESSION_KEY);
}

export async function logoutAdmin(): Promise<void> {
  const session = getAdminSession();
  if (session?.token) {
    const supabase = getSupabase();
    await supabase.rpc("logout_staff", { p_token: session.token });
  }
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
