import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, LogOut, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoginGate } from "./components/LoginGate";
import { ThreeShowcase } from "./components/ThreeShowcase";
import { WgslBackdrop } from "./components/WgslBackdrop";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

type Member = {
  id: number;
  name: string;
  km: number;
  steps: number;
  isUser?: boolean;
};

type Unit = "steps" | "km";
type SortBy = "steps" | "daily" | "name";
type OthersMode = "freeze" | "current" | "plus10";

type CurrentMember = Member & {
  currentSteps: number;
  currentKm: number;
  currentDailySteps: number;
  currentDailyKm: number;
};

type ProjectedMember = CurrentMember & {
  rateSteps: number;
  finalSteps: number;
  finalKm: number;
};

type DashboardState = {
  unit: Unit;
  sortBy: SortBy;
  realMode: boolean;
  dailyGoalSteps: number;
  todaySteps: number;
  daysRemaining: number;
  othersMode: OthersMode;
};

const TEAM_DATA: Member[] = [
  { id: 1, name: "Alberto Perez", km: 181.4, steps: 244807 },
  { id: 2, name: "Guillem Ferrer", km: 151.7, steps: 204829 },
  { id: 3, name: "Rosa Saez", km: 138.7, steps: 187172 },
  { id: 4, name: "Nuria Vilar", km: 135.2, steps: 182589 },
  { id: 5, name: "Lidia Lepiani", km: 99.5, steps: 134369 },
  { id: 6, name: "Anna Roca", km: 96.1, steps: 129644 },
  { id: 7, name: "Puri Martin", km: 94.0, steps: 126993 },
  { id: 8, name: "Marta Trigueros", km: 91.8, steps: 123947 },
  { id: 9, name: "Sandra Castellet", km: 91.8, steps: 123878 },
  { id: 10, name: "Anna Amouroux", km: 91.7, steps: 123751 },
  { id: 11, name: "Cristina Sanjose", km: 90.3, steps: 121900 },
  { id: 12, name: "Antonio Bueno", km: 33.3, steps: 44924, isUser: true },
];

const CUT_DATE = new Date("2026-04-20T14:54:00");
const USER_REAL_START_DATE = new Date("2026-04-20T00:00:00");
const DAYS_ELAPSED = 8;

const STEPS_PER_KM =
  TEAM_DATA.reduce((sum, member) => sum + member.steps, 0) /
  TEAM_DATA.reduce((sum, member) => sum + member.km, 0);

const user = TEAM_DATA.find((member) => member.isUser)!;

const numberFormat = new Intl.NumberFormat("es-ES");
const kmFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const kmFormat2 = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function stepsToKm(steps: number) {
  return steps / STEPS_PER_KM;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getInclusiveDaySpan(startDate: Date, endDate: Date) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
}

function getOthersFactor(mode: OthersMode) {
  if (mode === "freeze") return 0;
  if (mode === "plus10") return 1.1;
  return 1;
}

function formatSteps(value: number) {
  return numberFormat.format(Math.round(value));
}

function formatByUnit(steps: number, unit: Unit, digits = 1) {
  if (unit === "km") {
    return `${digits === 2 ? kmFormat2.format(stepsToKm(steps)) : kmFormat.format(stepsToKm(steps))} km`;
  }
  return `${formatSteps(steps)} pasos`;
}

function buildModel(state: DashboardState) {
  const userRealDays = getInclusiveDaySpan(USER_REAL_START_DATE, CUT_DATE);
  const effectiveUserDays = state.realMode ? userRealDays : DAYS_ELAPSED;
  const userBaselineSteps = state.realMode ? clamp(user.steps - state.todaySteps, 0, user.steps) : 0;

  const currentMembers: CurrentMember[] = TEAM_DATA.map((member) => {
    const currentSteps = member.isUser ? Math.max(member.steps - userBaselineSteps, 0) : member.steps;
    const currentKm = member.isUser ? stepsToKm(currentSteps) : member.km;
    const days = member.isUser ? effectiveUserDays : DAYS_ELAPSED;

    return {
      ...member,
      currentSteps,
      currentKm,
      currentDailySteps: currentSteps / days,
      currentDailyKm: currentKm / days,
    };
  });

  const currentSorted = [...currentMembers].sort((a, b) => {
    if (state.sortBy === "name") return a.name.localeCompare(b.name, "es");
    if (state.sortBy === "daily") {
      const aValue = state.unit === "km" ? a.currentDailyKm : a.currentDailySteps;
      const bValue = state.unit === "km" ? b.currentDailyKm : b.currentDailySteps;
      return bValue - aValue;
    }

    const aValue = state.unit === "km" ? a.currentKm : a.currentSteps;
    const bValue = state.unit === "km" ? b.currentKm : b.currentSteps;
    return bValue - aValue;
  });

  const othersFactor = getOthersFactor(state.othersMode);

  const projected: ProjectedMember[] = currentMembers.map((member) => {
    const rateSteps = member.isUser ? state.dailyGoalSteps : member.currentDailySteps * othersFactor;
    return {
      ...member,
      rateSteps,
      finalSteps: member.currentSteps + rateSteps * state.daysRemaining,
      finalKm: stepsToKm(member.currentSteps + rateSteps * state.daysRemaining),
    };
  });

  const projectedSorted = [...projected].sort((a, b) => b.finalSteps - a.finalSteps);
  const projectedUser = projectedSorted.find((member) => member.isUser)!;

  const projectedPosition = projectedSorted.findIndex((member) => member.isUser) + 1;
  const teamCurrentMean =
    currentMembers.reduce((sum, member) => sum + member.currentSteps, 0) / currentMembers.length;

  const teamFinalMean =
    projectedSorted.reduce((sum, member) => sum + member.finalSteps, 0) / projectedSorted.length;

  return {
    userBaselineSteps,
    currentMembers,
    currentSorted,
    projectedSorted,
    projectedUser,
    projectedPosition,
    teamCurrentMean,
    teamFinalMean,
  };
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<DashboardState>({
    unit: "steps",
    sortBy: "steps",
    realMode: true,
    dailyGoalSteps: 25000,
    todaySteps: 20134,
    daysRemaining: 22,
    othersMode: "current",
  });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const model = useMemo(() => buildModel(state), [state]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(220_26%_97%)] text-[hsl(220_18%_12%)]">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <nav className="h-11 w-full overflow-x-auto px-3">
          <div className="mx-auto flex h-full min-w-max max-w-6xl items-center justify-center gap-3 text-xs">
            <a href="#hero" className="rounded-full px-2 py-1 hover:bg-slate-100">
              Resumen
            </a>
            <a href="#dashboard" className="rounded-full px-2 py-1 hover:bg-slate-100">
              Equipo
            </a>
            <a href="#simulador" className="rounded-full px-2 py-1 hover:bg-slate-100">
              Simulador
            </a>
            <a href="#tech" className="rounded-full px-2 py-1 hover:bg-slate-100">
              Tech
            </a>
          </div>
        </nav>

        <div className="h-14 border-t border-slate-200/70 px-3">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2">
            <p className="truncate text-base font-semibold">Economia i Finances+</p>

            <div className="flex items-center gap-2">
              <select
                value={state.unit}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, unit: event.target.value as Unit }))
                }
                className="h-9 rounded-full border border-slate-300 bg-white px-3 text-sm"
                aria-label="Unidad"
              >
                <option value="steps">Pasos</option>
                <option value="km">Km</option>
              </select>

              <Button
                variant={state.realMode ? "default" : "outline"}
                size="sm"
                onClick={() => setState((prev) => ({ ...prev, realMode: !prev.realMode }))}
              >
                Real D20+
              </Button>

              <Button variant="outline" size="icon" onClick={onLogout} aria-label="Cerrar sesion">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28">
        <section id="hero" className="relative isolate overflow-hidden bg-slate-950">
          <video
            className="absolute inset-0 -z-30 h-full w-full object-cover opacity-40"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={`${import.meta.env.BASE_URL}hero-bg.svg`}
          >
            <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
          </video>
          <WgslBackdrop />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-black/20" />

          <div className="container py-14 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-200/90">Reto Steppers</p>
              <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl">
                Dashboard passes con motor React + shaders
              </h1>
              <p className="mt-4 max-w-xl text-base text-slate-200 md:text-lg">
                Login previo, ranking real D20+, simulador y escena 3D con raymarching, caustics
                y luces físicas para despliegue en GitHub Pages.
              </p>
            </motion.div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Card className="border-white/20 bg-white/10 text-white backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-cyan-100/90">Total usuario</CardDescription>
                  <CardTitle className="text-2xl text-white">
                    {formatByUnit(model.projectedUser.currentSteps, state.unit, 1)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-white/20 bg-white/10 text-white backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-cyan-100/90">Posición estimada final</CardDescription>
                  <CardTitle className="text-2xl text-white">{model.projectedPosition}º</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-white/20 bg-white/10 text-white backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-cyan-100/90">Pasos hoy</CardDescription>
                  <CardTitle className="text-2xl text-white">{formatSteps(state.todaySteps)}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section id="dashboard" className="container py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-semibold">Radiografía del equipo</h2>
            <p className="mt-2 text-slate-600">
              Datos reales del corte 20/04/2026. En modo real se descuenta tu acumulado previo a
              la competición.
            </p>
          </motion.div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Media actual del equipo</CardDescription>
                <CardTitle>
                  {state.unit === "km"
                    ? `${kmFormat.format(stepsToKm(model.teamCurrentMean))} km`
                    : `${formatSteps(model.teamCurrentMean)} pasos`}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Media final estimada</CardDescription>
                <CardTitle>
                  {state.unit === "km"
                    ? `${kmFormat.format(stepsToKm(model.teamFinalMean))} km`
                    : `${formatSteps(model.teamFinalMean)} pasos`}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Pasos descontados por modo real</CardDescription>
                <CardTitle>{formatSteps(model.userBaselineSteps)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="mt-5 overflow-hidden">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Ranking actual</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="sort-by">Ordenar</Label>
                <select
                  id="sort-by"
                  value={state.sortBy}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, sortBy: event.target.value as SortBy }))
                  }
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="steps">Pasos totales</option>
                  <option value="daily">Media diaria</option>
                  <option value="name">Nombre</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="overflow-x-auto pb-6">
              <table className="min-w-[680px] w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Pos</th>
                    <th className="border-b border-slate-200 px-3 py-2">Miembro</th>
                    <th className="border-b border-slate-200 px-3 py-2">Total</th>
                    <th className="border-b border-slate-200 px-3 py-2">Media diaria</th>
                  </tr>
                </thead>
                <tbody>
                  {model.currentSorted.map((member, index) => (
                    <tr key={member.id} className={member.isUser ? "bg-blue-50/70" : ""}>
                      <td className="border-b border-slate-100 px-3 py-2">{index + 1}º</td>
                      <td className="border-b border-slate-100 px-3 py-2 font-medium">
                        {member.name}
                        {member.isUser ? " (Tú)" : ""}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        {state.unit === "km"
                          ? `${kmFormat.format(member.currentKm)} km`
                          : `${formatSteps(member.currentSteps)} pasos`}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        {state.unit === "km"
                          ? `${kmFormat2.format(member.currentDailyKm)} km`
                          : `${formatSteps(member.currentDailySteps)} pasos`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section id="simulador" className="bg-slate-950 py-12 text-white">
          <div className="container grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-white/15 bg-white/5 text-white">
              <CardHeader>
                <CardTitle>Simulador</CardTitle>
                <CardDescription className="text-slate-300">
                  Ajusta objetivo diario y escenario del equipo para proyectar cierre.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="goal-range" className="text-slate-200">
                    Objetivo diario
                  </Label>
                  <Input
                    id="goal-range"
                    type="range"
                    min={10000}
                    max={35000}
                    step={500}
                    value={state.dailyGoalSteps}
                    onChange={(event) =>
                      setState((prev) => ({ ...prev, dailyGoalSteps: Number(event.target.value) }))
                    }
                    className="h-3 border-none bg-transparent px-0"
                  />
                  <Input
                    type="number"
                    min={10000}
                    max={35000}
                    step={500}
                    value={state.dailyGoalSteps}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        dailyGoalSteps: clamp(Number(event.target.value) || 10000, 10000, 35000),
                      }))
                    }
                    className="bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="today-steps" className="text-slate-200">
                    Pasos hoy
                  </Label>
                  <Input
                    id="today-steps"
                    type="number"
                    min={0}
                    max={120000}
                    value={state.todaySteps}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        todaySteps: clamp(Number(event.target.value) || 0, 0, 120000),
                      }))
                    }
                    className="bg-white text-slate-900"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="days-remaining" className="text-slate-200">
                      Días restantes
                    </Label>
                    <Input
                      id="days-remaining"
                      type="number"
                      min={1}
                      max={60}
                      value={state.daysRemaining}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          daysRemaining: clamp(Number(event.target.value) || 1, 1, 60),
                        }))
                      }
                      className="bg-white text-slate-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="others-mode" className="text-slate-200">
                      Escenario del equipo
                    </Label>
                    <select
                      id="others-mode"
                      value={state.othersMode}
                      onChange={(event) =>
                        setState((prev) => ({ ...prev, othersMode: event.target.value as OthersMode }))
                      }
                      className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    >
                      <option value="freeze">No suman más</option>
                      <option value="current">Mantienen media</option>
                      <option value="plus10">Aprietan +10%</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/15 bg-white/5 text-white">
              <CardHeader>
                <CardTitle>Proyección del usuario</CardTitle>
                <CardDescription className="text-slate-300">
                  Resultado estimado según el ritmo configurado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Total final estimado</p>
                  <p className="mt-1 text-3xl font-semibold">
                    {formatByUnit(model.projectedUser.finalSteps, state.unit, 1)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Posición final</p>
                  <p className="mt-1 text-3xl font-semibold">{model.projectedPosition}º</p>
                </div>

                <div className="space-y-2">
                  {model.projectedSorted.map((member) => {
                    const max = model.projectedSorted[0].finalSteps || 1;
                    const width = (member.finalSteps / max) * 100;
                    return (
                      <div key={member.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>
                            {member.name}
                            {member.isUser ? " (Tú)" : ""}
                          </span>
                          <span>{formatSteps(member.finalSteps)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${member.isUser ? "bg-cyan-300" : "bg-slate-300/70"}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="tech" className="container py-12">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Tecnologías activas en este despliegue
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card className="overflow-hidden border-slate-300/70">
              <CardHeader>
                <CardTitle>WebGL GLSL + Raymarching + Caustics</CardTitle>
                <CardDescription>
                  Shader nativo en plano 3D con SDF raymarching y patrón caústico animado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThreeShowcase />
              </CardContent>
            </Card>

            <Card className="border-slate-300/70">
              <CardHeader>
                <CardTitle>WGSL (WebGPU) + React + Framer Motion</CardTitle>
                <CardDescription>
                  Capa WGSL auto-composited en hero (si el navegador soporta WebGPU) y
                  transiciones con Framer Motion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>
                  Stack desplegado: React 19 + TypeScript + Vite + Tailwind + base de
                  componentes shadcn/ui.
                </p>
                <p>
                  3D con iluminación físicamente plausible: Three.js + React Three Fiber.
                </p>
                <p>Login previo requerido antes de mostrar el dashboard.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/60 py-6 text-center text-sm text-slate-500">
        passes · despliegue GitHub Pages · corte de datos 20/04/2026
      </footer>

      <AnimatePresence>
        {showScrollTop ? (
          <motion.button
            key="scroll-top"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900 shadow-lg"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Subir arriba"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("passes-auth") === "ok"
  );

  const logout = () => {
    localStorage.removeItem("passes-auth");
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <LoginGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={logout} />;
}
