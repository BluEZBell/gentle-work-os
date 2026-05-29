import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { users, type Role, type User } from "./mockData";

interface AuthCtx {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  can: (action: "edit" | "delete" | "export") => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "mto-demo-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);
  const login = (email: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return false;
    setUser(u);
    localStorage.setItem(KEY, JSON.stringify(u));
    return true;
  };
  const logout = () => { setUser(null); localStorage.removeItem(KEY); };
  const can = (action: "edit" | "delete" | "export") => {
    if (!user) return false;
    if (user.role === "Owner") return true;
    if (user.role === "Operator") return action === "edit";
    return false;
  };
  return <Ctx.Provider value={{ user, login, logout, can }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
};

export const roleBadge = (r: Role) =>
  r === "Owner" ? "bg-primary text-primary-foreground"
    : r === "Operator" ? "bg-info-soft text-info"
    : "bg-muted text-muted-foreground";
