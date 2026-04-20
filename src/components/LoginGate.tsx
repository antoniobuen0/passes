import { FormEvent, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface LoginGateProps {
  onAuthenticated: () => void;
}

const VALID_USERNAME = "anto";
const VALID_PASSWORD = "uoc";

export function LoginGate({ onAuthenticated }: LoginGateProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValid =
      username.trim().toLowerCase() === VALID_USERNAME &&
      password.trim().toLowerCase() === VALID_PASSWORD;

    if (!isValid) {
      setError("Credenciales incorrectas.");
      return;
    }

    localStorage.setItem("passes-auth", "ok");
    onAuthenticated();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(91,154,255,0.22),transparent_34%),radial-gradient(circle_at_82%_30%,rgba(0,212,255,0.18),transparent_42%),linear-gradient(120deg,#020617_0%,#0f172a_56%,#111827_100%)]" />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative mx-auto mt-10 w-full max-w-md"
      >
        <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Acceso a passes</CardTitle>
            <CardDescription>
              Login previo requerido para ver el dashboard del ranking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">User</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="anto"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Pass</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="uoc"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.section>
    </main>
  );
}
