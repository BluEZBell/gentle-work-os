import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Lock, Building2 } from "lucide-react";
import { users } from "@/lib/mockData";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("owner@mto.demo");
  const [password, setPassword] = useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email)) {
      toast.success("Welcome back");
      navigate("/", { replace: true });
    } else {
      toast.error("Use one of the demo accounts below");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="m-auto px-12 max-w-lg text-primary-foreground">
          <div className="flex items-center gap-2 mb-8 opacity-90">
            <div className="w-9 h-9 rounded-lg bg-primary-foreground text-primary grid place-items-center font-display font-bold">M</div>
            <span className="font-display font-semibold">MTO Business OS</span>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            A calm, private operating system for your make-to-order business.
          </h1>
          <p className="mt-4 text-primary-foreground/85 leading-relaxed">
            Connect customers, deals, quotations, jobs, suppliers, and after-sales
            into one trustworthy workflow — built for small B2B teams.
          </p>
          <div className="mt-10 grid gap-3 text-sm">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Private deployment, VPN-only recommended</div>
            <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Confidential customers & suppliers flagged</div>
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Designed for 1–2 person family businesses</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 card-soft">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Demo authentication — pick any role.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <div className="mt-6 border-t pt-4">
            <div className="text-xs font-medium text-muted-foreground mb-2">Demo accounts</div>
            <div className="grid gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id} type="button"
                  onClick={() => { setEmail(u.email); login(u.email); navigate("/"); }}
                  className="text-left text-sm px-3 py-2 rounded-md border hover:bg-accent transition-colors flex justify-between"
                >
                  <span>{u.name}</span>
                  <span className="text-muted-foreground">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
