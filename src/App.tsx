import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LoginGate } from "./components/LoginGate";
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
type GapMode = "steps" | "daily";

type DashboardState = {
  unit: Unit;
  sortBy: SortBy;
  realMode: boolean;
  dailyGoalSteps: number;
  daysRemaining: number;
  othersMode: OthersMode;
  blockMorning: number;
  blockTreadmill: number;
  blockEvening: number;
  trendDay: number;
  gapMode: GapMode;
};

type CurrentMember = Member & {
  currentSteps: number;
  currentKm: number;
  currentDays: number;
  currentDailySteps: number;
  currentDailyKm: number;
};

type ProjectedMember = CurrentMember & {
  rateSteps: number;
  rateKm: number;
  finalSteps: number;
  finalKm: number;
};

type TrendPoint = {
  day: number;
  userSteps: number;
  leaderSteps: number;
  teamMeanSteps: number;
  rank: number;
};

type VisibleGap = {
  name: string;
  stepsGap: number;
  dailyStepsGap: number;
};

const INITIAL_TEAM_DATA: Member[] = [
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
const TODAY_STEPS_FIXED = 26399;
const FALLBACK_STEPS_PER_KM = 1349;
const TEAM_DATA_STORAGE_KEY = "passes-team-data";

const numberFormat = new Intl.NumberFormat("es-ES");
const kmFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const kmFormat2 = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatSteps(value: number) {
  return numberFormat.format(Math.round(value));
}

function getInclusiveDaySpan(startDate: Date, endDate: Date) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const millis = end.getTime() - start.getTime();
  const days = Math.floor(millis / 86400000) + 1;
  return Math.max(days, 1);
}

function getOthersFactor(mode: OthersMode) {
  if (mode === "freeze") return 0;
  if (mode === "plus10") return 1.1;
  return 1;
}

function getConversionMetrics(teamData: Member[]) {
  const validRatios = teamData
    .filter((member) => member.km > 0 && member.steps > 0)
    .map((member) => member.steps / member.km);

  if (validRatios.length === 0) {
    return {
      stepsPerKm: FALLBACK_STEPS_PER_KM,
      conversionMin: FALLBACK_STEPS_PER_KM,
      conversionMax: FALLBACK_STEPS_PER_KM,
    };
  }

  const validMembers = teamData.filter((member) => member.km > 0 && member.steps > 0);
  const stepsPerKm =
    validMembers.reduce((sum, member) => sum + member.steps, 0) /
    validMembers.reduce((sum, member) => sum + member.km, 0);

  return {
    stepsPerKm,
    conversionMin: Math.min(...validRatios),
    conversionMax: Math.max(...validRatios),
  };
}

function stepsToKm(steps: number, stepsPerKm: number) {
  return steps / stepsPerKm;
}

function kmToSteps(km: number, stepsPerKm: number) {
  return km * stepsPerKm;
}

function formatValueByUnit(valueSteps: number, unit: Unit, stepsPerKm: number, digits = 1) {
  if (unit === "km") {
    const kmValue = stepsToKm(valueSteps, stepsPerKm);
    return `${digits === 2 ? kmFormat2.format(kmValue) : kmFormat.format(kmValue)} km`;
  }

  return `${formatSteps(valueSteps)} pasos`;
}

function parseUnitInput(rawValue: string, unit: Unit, stepsPerKm: number) {
  const raw = Number(rawValue);

  if (Number.isNaN(raw)) {
    return 0;
  }

  return unit === "km" ? kmToSteps(raw, stepsPerKm) : raw;
}

function displayValueFromSteps(valueSteps: number, unit: Unit, stepsPerKm: number) {
  return unit === "km" ? stepsToKm(valueSteps, stepsPerKm) : valueSteps;
}

function getMicroPlanStatus(
  unit: Unit,
  stepsPerKm: number,
  totalBlocks: number,
  dailyGoalSteps: number
) {
  const diff = totalBlocks - dailyGoalSteps;
  const totalLabel = formatValueByUnit(totalBlocks, unit, stepsPerKm, 2);

  if (diff === 0) {
    return `Plan perfecto: ${totalLabel} (objetivo clavado).`;
  }

  if (diff > 0) {
    return `Plan exigente: te sobran ${formatValueByUnit(diff, unit, stepsPerKm, 2)} sobre el objetivo.`;
  }

  return `Te faltan ${formatValueByUnit(Math.abs(diff), unit, stepsPerKm, 2)} para llegar al objetivo diario.`;
}

function loadStoredTeamData() {
  if (typeof window === "undefined") {
    return INITIAL_TEAM_DATA;
  }

  try {
    const raw = window.localStorage.getItem(TEAM_DATA_STORAGE_KEY);
    if (!raw) return INITIAL_TEAM_DATA;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_TEAM_DATA;

    return INITIAL_TEAM_DATA.map((member) => {
      const stored = parsed.find((entry) => Number(entry?.id) === member.id);
      if (!stored) return member;

      const steps = Number.isFinite(Number(stored.steps)) ? Math.max(Number(stored.steps), 0) : member.steps;
      const km = Number.isFinite(Number(stored.km)) ? Math.max(Number(stored.km), 0) : member.km;

      return {
        ...member,
        steps,
        km,
      };
    });
  } catch {
    return INITIAL_TEAM_DATA;
  }
}

function createLinePath(
  points: Array<{ day: number; value: number }>,
  maxDay: number,
  minValue: number,
  maxValue: number
) {
  const width = 920;
  const height = 320;
  const padX = 52;
  const padY = 24;
  const xSpan = width - padX * 2;
  const ySpan = height - padY * 2;
  const valueRange = maxValue - minValue || 1;

  return points
    .map((point, index) => {
      const x = padX + (point.day / (maxDay || 1)) * xSpan;
      const y = height - padY - ((point.value - minValue) / valueRange) * ySpan;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildOvertakeTimeline(
  state: DashboardState,
  teamData: Member[],
  userCurrentSteps: number
) {
  const result: Array<{ name: string; status: string; day: number | null }> = [];

  teamData
    .filter((member) => !member.isUser)
    .forEach((member) => {
      const otherRateSteps = (member.steps / DAYS_ELAPSED) * getOthersFactor(state.othersMode);

      if (userCurrentSteps > member.steps) {
        result.push({ name: member.name, status: "ya superado", day: 0 });
        return;
      }

      if (state.dailyGoalSteps <= otherRateSteps) {
        result.push({
          name: member.name,
          status: "no alcanzable con este ritmo",
          day: null,
        });
        return;
      }

      const daysToCatch = Math.ceil(
        (member.steps - userCurrentSteps) / (state.dailyGoalSteps - otherRateSteps)
      );

      if (daysToCatch > state.daysRemaining) {
        result.push({
          name: member.name,
          status: "después del fin del reto",
          day: null,
        });
        return;
      }

      const date = new Date(CUT_DATE);
      date.setDate(date.getDate() + daysToCatch);

      result.push({
        name: member.name,
        status: `aprox. el ${dateFormat.format(date)}`,
        day: daysToCatch,
      });
    });

  result.sort((a, b) => {
    if (a.day === null && b.day === null) return a.name.localeCompare(b.name, "es");
    if (a.day === null) return 1;
    if (b.day === null) return -1;
    return a.day - b.day;
  });

  return result;
}

function buildModel(teamData: Member[], state: DashboardState) {
  const { stepsPerKm, conversionMin, conversionMax } = getConversionMetrics(teamData);
  const user = teamData.find((member) => member.isUser) ?? teamData[0];
  const userBaselineSteps = state.realMode
    ? clamp(user.steps - TODAY_STEPS_FIXED, 0, user.steps)
    : 0;
  const realDaysElapsed = getInclusiveDaySpan(USER_REAL_START_DATE, CUT_DATE);
  const userDaysElapsed = state.realMode ? realDaysElapsed : DAYS_ELAPSED;

  const currentMembers: CurrentMember[] = teamData.map((member) => {
    const currentSteps = member.isUser ? Math.max(member.steps - userBaselineSteps, 0) : member.steps;
    const currentKm = member.isUser ? stepsToKm(currentSteps, stepsPerKm) : member.km;
    const currentDays = member.isUser ? userDaysElapsed : DAYS_ELAPSED;

    return {
      ...member,
      currentSteps,
      currentKm,
      currentDays,
      currentDailySteps: currentSteps / currentDays,
      currentDailyKm: currentKm / currentDays,
    };
  });

  const currentSorted = [...currentMembers].sort((a, b) => {
    if (state.sortBy === "daily") {
      const aDaily = state.unit === "km" ? a.currentDailyKm : a.currentDailySteps;
      const bDaily = state.unit === "km" ? b.currentDailyKm : b.currentDailySteps;
      return bDaily - aDaily;
    }

    if (state.sortBy === "name") {
      return a.name.localeCompare(b.name, "es");
    }

    return state.unit === "km" ? b.currentKm - a.currentKm : b.currentSteps - a.currentSteps;
  });

  const othersFactor = getOthersFactor(state.othersMode);

  const projectedMembers: ProjectedMember[] = currentMembers.map((member) => {
    const rateSteps = member.isUser ? state.dailyGoalSteps : member.currentDailySteps * othersFactor;
    const rateKm = member.isUser ? stepsToKm(state.dailyGoalSteps, stepsPerKm) : member.currentDailyKm * othersFactor;
    const finalSteps = member.currentSteps + rateSteps * state.daysRemaining;

    return {
      ...member,
      rateSteps,
      rateKm,
      finalSteps,
      finalKm: stepsToKm(finalSteps, stepsPerKm),
    };
  });

  const sortedProjected = [...projectedMembers].sort((a, b) => b.finalSteps - a.finalSteps);
  const projectedUser = sortedProjected.find((member) => member.isUser) ?? sortedProjected[0];
  const projectedPosition = sortedProjected.findIndex((member) => member.isUser) + 1;

  const teamTotalCurrentSteps = projectedMembers.reduce((sum, member) => sum + member.currentSteps, 0);
  const teamMeanCurrentSteps = teamTotalCurrentSteps / projectedMembers.length;
  const teamMeanWithoutUserSteps =
    projectedMembers.length > 1
      ? (teamTotalCurrentSteps - projectedUser.currentSteps) / (projectedMembers.length - 1)
      : teamMeanCurrentSteps;
  const penaltySteps = teamMeanWithoutUserSteps - teamMeanCurrentSteps;
  const finalTeamMeanSteps =
    sortedProjected.reduce((sum, member) => sum + member.finalSteps, 0) / sortedProjected.length;

  const totalDays = userDaysElapsed + state.daysRemaining;
  const userFinalDailyRealSteps = projectedUser.finalSteps / totalDays;
  const directMeanLiftSteps = (state.dailyGoalSteps * state.daysRemaining) / projectedMembers.length;
  const liftVsCurrentRateSteps =
    ((state.dailyGoalSteps - projectedUser.currentDailySteps) * state.daysRemaining) /
    projectedMembers.length;

  const trendSeries: TrendPoint[] = [];
  for (let day = 0; day <= state.daysRemaining; day += 1) {
    const points = projectedMembers.map((member) => ({
      ...member,
      atDaySteps: member.currentSteps + member.rateSteps * day,
    }));

    const userAtDaySteps = points.find((member) => member.isUser)?.atDaySteps ?? 0;
    const leaderAtDaySteps = Math.max(...points.map((member) => member.atDaySteps));
    const teamMeanAtDaySteps =
      points.reduce((sum, member) => sum + member.atDaySteps, 0) / points.length;
    const rankAtDay = 1 + points.filter((member) => member.atDaySteps > userAtDaySteps).length;

    trendSeries.push({
      day,
      userSteps: userAtDaySteps,
      leaderSteps: leaderAtDaySteps,
      teamMeanSteps: teamMeanAtDaySteps,
      rank: rankAtDay,
    });
  }

  const safeTrendDay = clamp(state.trendDay, 0, state.daysRemaining);
  const selectedTrend = trendSeries[safeTrendDay];

  const gaps: VisibleGap[] = projectedMembers
    .filter((member) => !member.isUser)
    .map((member) => {
      const memberAtDaySteps = member.currentSteps + member.rateSteps * safeTrendDay;
      const userAtDaySteps = projectedUser.currentSteps + state.dailyGoalSteps * safeTrendDay;

      return {
        name: member.name,
        stepsGap: memberAtDaySteps - userAtDaySteps,
        dailyStepsGap: member.rateSteps - state.dailyGoalSteps,
      };
    });

  const gapKey = state.gapMode === "daily" ? "dailyStepsGap" : "stepsGap";
  const visibleGaps = gaps
    .sort((a, b) => Math.abs(a[gapKey]) - Math.abs(b[gapKey]))
    .slice(0, 8);

  const totalBlocks = state.blockMorning + state.blockTreadmill + state.blockEvening;

  return {
    user: projectedUser,
    stepsPerKm,
    conversionMin,
    conversionMax,
    realDaysElapsed,
    userBaselineSteps,
    currentMembers,
    currentSorted,
    sortedProjected,
    projectedPosition,
    teamMeanCurrentSteps,
    teamMeanWithoutUserSteps,
    penaltySteps,
    finalTeamMeanSteps,
    userFinalDailyRealSteps,
    directMeanLiftSteps,
    liftVsCurrentRateSteps,
    trendSeries,
    selectedTrend,
    visibleGaps,
    totalBlocks,
    microPlanStatus: getMicroPlanStatus(state.unit, stepsPerKm, totalBlocks, state.dailyGoalSteps),
    overtakeTimeline: buildOvertakeTimeline(state, teamData, projectedUser.currentSteps),
  };
}

function MetricCard({
  title,
  value,
  subtitle,
  dark = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <Card className={dark ? "border-white/[0.15] bg-white/[0.06] text-white" : "border-slate-200/80 bg-white"}>
      <CardHeader className="pb-2">
        <CardDescription className={dark ? "text-white/70" : "text-slate-500"}>
          {title}
        </CardDescription>
        <CardTitle className={dark ? "text-white" : "text-slate-950"}>{value}</CardTitle>
      </CardHeader>
      {subtitle ? (
        <CardContent className={dark ? "text-sm text-white/[0.72]" : "text-sm text-slate-500"}>
          {subtitle}
        </CardContent>
      ) : null}
    </Card>
  );
}

function TrendChart({
  state,
  model,
}: {
  state: DashboardState;
  model: ReturnType<typeof buildModel>;
}) {
  const width = 920;
  const height = 320;
  const padX = 52;
  const padY = 24;
  const xSpan = width - padX * 2;
  const ySpan = height - padY * 2;

  const series = model.trendSeries.map((point) => ({
    day: point.day,
    user:
      state.unit === "km" ? stepsToKm(point.userSteps, model.stepsPerKm) : point.userSteps,
    teamMean:
      state.unit === "km"
        ? stepsToKm(point.teamMeanSteps, model.stepsPerKm)
        : point.teamMeanSteps,
    leader:
      state.unit === "km"
        ? stepsToKm(point.leaderSteps, model.stepsPerKm)
        : point.leaderSteps,
  }));

  const maxDay = Math.max(...series.map((point) => point.day), 1);
  const maxValue = Math.max(...series.flatMap((point) => [point.user, point.teamMean, point.leader]));
  const minValue = Math.min(...series.flatMap((point) => [point.user, point.teamMean, point.leader]));
  const valueRange = maxValue - minValue || 1;

  const userPath = createLinePath(
    series.map((point) => ({ day: point.day, value: point.user })),
    maxDay,
    minValue,
    maxValue
  );
  const teamPath = createLinePath(
    series.map((point) => ({ day: point.day, value: point.teamMean })),
    maxDay,
    minValue,
    maxValue
  );
  const leaderPath = createLinePath(
    series.map((point) => ({ day: point.day, value: point.leader })),
    maxDay,
    minValue,
    maxValue
  );

  const selected = series[model.selectedTrend.day];
  const selectedX = padX + (selected.day / maxDay) * xSpan;
  const selectedUserY = height - padY - ((selected.user - minValue) / valueRange) * ySpan;
  const selectedTeamY = height - padY - ((selected.teamMean - minValue) / valueRange) * ySpan;
  const selectedLeaderY = height - padY - ((selected.leader - minValue) / valueRange) * ySpan;

  const selectedDate = new Date(CUT_DATE);
  selectedDate.setDate(selectedDate.getDate() + selected.day);

  return (
    <Card className="border-slate-200/80 bg-white">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Evolución prevista</CardTitle>
            <CardDescription>
              Día {selected.day} de {maxDay} · {dateFormat.format(selectedDate)} · Puesto{" "}
              {model.selectedTrend.rank}º
            </CardDescription>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="trend-day">Día proyectado</Label>
            <Input
              id="trend-day"
              type="range"
              min={0}
              max={state.daysRemaining}
              value={state.trendDay}
              onChange={() => {}}
              readOnly
              className="h-3 border-none bg-transparent px-0"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="block w-full touch-pan-x">
          {Array.from({ length: 5 }, (_, index) => {
            const ratio = index / 4;
            const y = padY + ratio * ySpan;
            const value = maxValue - ratio * valueRange;
            const label =
              state.unit === "km" ? `${kmFormat.format(value)} km` : `${formatSteps(value)} pasos`;

            return (
              <g key={`h-${index}`}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="#e8e8ed"
                  strokeWidth="1"
                />
                <text x="8" y={y + 4} fontSize="11" fill="#6e6e73">
                  {label}
                </text>
              </g>
            );
          })}

          {Array.from({ length: 6 }, (_, index) => {
            const ratio = index / 5;
            const day = Math.round(ratio * maxDay);
            const x = padX + ratio * xSpan;

            return (
              <g key={`v-${index}`}>
                <line
                  x1={x}
                  y1={padY}
                  x2={x}
                  y2={height - padY}
                  stroke="#f1f1f4"
                  strokeWidth="1"
                />
                <text x={x} y={height - 4} textAnchor="middle" fontSize="11" fill="#6e6e73">
                  D{day}
                </text>
              </g>
            );
          })}

          <line
            x1={selectedX}
            y1={padY}
            x2={selectedX}
            y2={height - padY}
            stroke="#0071e3"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path d={leaderPath} fill="none" stroke="#6e6e73" strokeWidth="2.5" />
          <path d={teamPath} fill="none" stroke="#333336" strokeWidth="2.5" />
          <path d={userPath} fill="none" stroke="#0071e3" strokeWidth="3" />
          <circle cx={selectedX} cy={selectedLeaderY} r="5" fill="#6e6e73" />
          <circle cx={selectedX} cy={selectedTeamY} r="5" fill="#333336" />
          <circle cx={selectedX} cy={selectedUserY} r="6" fill="#0071e3" />
        </svg>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{model.user.name} acumulado</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatValueByUnit(model.selectedTrend.userSteps, state.unit, model.stepsPerKm, 1)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Media del equipo</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatValueByUnit(model.selectedTrend.teamMeanSteps, state.unit, model.stepsPerKm, 1)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Líder acumulado</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatValueByUnit(model.selectedTrend.leaderSteps, state.unit, model.stepsPerKm, 1)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [state, setState] = useState<DashboardState>({
    unit: "steps",
    sortBy: "steps",
    realMode: true,
    dailyGoalSteps: 25000,
    daysRemaining: 22,
    othersMode: "current",
    blockMorning: 9000,
    blockTreadmill: 8000,
    blockEvening: 8000,
    trendDay: 8,
    gapMode: "steps",
  });
  const [teamData, setTeamData] = useState<Member[]>(() => loadStoredTeamData());
  const [showScrollTop, setShowScrollTop] = useState(false);

  const model = useMemo(() => buildModel(teamData, state), [teamData, state]);

  useEffect(() => {
    window.localStorage.setItem(
      TEAM_DATA_STORAGE_KEY,
      JSON.stringify(teamData.map(({ id, km, steps }) => ({ id, km, steps })))
    );
  }, [teamData]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const unitInputMeta =
    state.unit === "km"
      ? { min: 7, max: 30, step: 0.1 }
      : { min: 10000, max: 35000, step: 500 };

  const displayedGoal = displayValueFromSteps(model.user.rateSteps, state.unit, model.stepsPerKm);
  const displayedMorning = displayValueFromSteps(state.blockMorning, state.unit, model.stepsPerKm);
  const displayedTreadmill = displayValueFromSteps(
    state.blockTreadmill,
    state.unit,
    model.stepsPerKm
  );
  const displayedEvening = displayValueFromSteps(state.blockEvening, state.unit, model.stepsPerKm);

  const updateMember = (memberId: number, field: "steps" | "km", rawValue: string) => {
    const nextValue = Number(rawValue);

    setTeamData((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              [field]: Number.isNaN(nextValue) ? 0 : Math.max(nextValue, 0),
            }
          : member
      )
    );
  };

  const resetTeamData = () => {
    setTeamData(INITIAL_TEAM_DATA);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-black/8 bg-white/85 backdrop-blur-xl">
        <nav className="h-11 overflow-x-auto px-3">
          <div className="mx-auto flex h-full min-w-max max-w-6xl items-center justify-center gap-3 text-xs text-black/80">
            <a href="#hero" className="rounded-full px-2 py-1 hover:bg-black/5">
              Resumen
            </a>
            <a href="#equipo" className="rounded-full px-2 py-1 hover:bg-black/5">
              Equipo
            </a>
            <a href="#simulador" className="rounded-full px-2 py-1 hover:bg-black/5">
              Simulador
            </a>
            <a href="#tendencia" className="rounded-full px-2 py-1 hover:bg-black/5">
              Tendencia
            </a>
          </div>
        </nav>

        <div className="h-14 border-t border-black/[0.06] px-3">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3">
            <p className="truncate text-base font-semibold text-[#333336]">Economia i Finances+</p>

            <div className="flex items-center gap-2">
              <select
                value={state.unit}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, unit: event.target.value as Unit }))
                }
                className="h-9 min-w-24 rounded-full border border-[#e8e8ed] bg-white px-3 text-sm text-[#333336]"
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

              <Button variant="outline" size="icon" onClick={onLogout} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28">
        <section id="hero" className="relative isolate overflow-hidden bg-black">
          <video
            className="absolute inset-0 -z-30 h-full w-full object-cover opacity-40"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={`${import.meta.env.BASE_URL}hero-bg.svg`}
          >
            <source
              src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4"
              type="video/mp4"
            />
          </video>
          <WgslBackdrop />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 to-black/20" />

          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <p className="mb-3 text-xs uppercase tracking-[0.08em] text-white/80">Reto Steppers</p>
              <div className="inline-block rounded-[18px] border border-white/25 bg-black/45 px-5 py-5 shadow-2xl backdrop-blur">
                <h1 className="max-w-[14ch] text-4xl font-bold tracking-[-0.02em] text-white md:text-6xl">
                  Seguimiento real del equipo y proyección de cierre
                </h1>
              </div>
              <p className="mt-5 max-w-3xl text-base text-white/90 md:text-lg">
                Ranking actual, simulación del tramo final y lectura completa del impacto de tus
                pasos dentro del equipo.
              </p>
            </motion.div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <Card className="border-white/[0.18] bg-white/[0.08] text-white backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/75">
                    {state.realMode ? "Total real D20+" : "Total actual"}
                  </CardDescription>
                  <CardTitle className="text-white">
                    {formatValueByUnit(model.user.currentSteps, state.unit, model.stepsPerKm, 1)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-white/[0.18] bg-white/[0.08] text-white backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/75">Posición estimada final</CardDescription>
                  <CardTitle className="text-white">{model.projectedPosition}º</CardTitle>
                </CardHeader>
              </Card>

              <Card className="border-white/[0.18] bg-white/[0.08] text-white backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/75">Ritmo hoy</CardDescription>
                  <CardTitle className="text-white">
                    {formatValueByUnit(TODAY_STEPS_FIXED, state.unit, model.stepsPerKm, 2)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section id="equipo" className="mx-auto max-w-6xl px-5 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#1d1d1f]">
              Radiografía del equipo
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-[#333336]">
              Datos del corte 20/04/2026. En modo real se descuenta tu acumulado previo a la
              competición y se recalcula todo el modelo sobre la marcha.
            </p>
          </motion.div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={`Media actual (${teamData.length})`}
              value={formatValueByUnit(model.teamMeanCurrentSteps, state.unit, model.stepsPerKm, 1)}
              subtitle={`${state.unit === "km" ? "km" : "pasos"} por miembro`}
            />
            <MetricCard
              title={`Media sin ti (${Math.max(teamData.length - 1, 1)})`}
              value={formatValueByUnit(
                model.teamMeanWithoutUserSteps,
                state.unit,
                model.stepsPerKm,
                1
              )}
              subtitle={`${state.unit === "km" ? "km" : "pasos"} por miembro`}
            />
            <MetricCard
              title="Impacto actual"
              value={`-${formatValueByUnit(model.penaltySteps, state.unit, model.stepsPerKm, 1)}`}
              subtitle="penalización por entrada tardía"
            />
            <MetricCard
              title="Ritmo hoy"
              value={formatValueByUnit(TODAY_STEPS_FIXED, state.unit, model.stepsPerKm, 2)}
              subtitle={`${state.unit === "km" ? "km" : "pasos"} reportados hoy`}
            />
          </div>

          <Card className="mt-6 overflow-hidden border-slate-200/80 bg-white">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Ranking actual</CardTitle>
                <CardDescription>
                  Orden dinámico sobre los datos actuales del equipo.
                </CardDescription>
              </div>

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
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Pos</th>
                    <th className="border-b border-slate-200 px-3 py-2">Miembro</th>
                    <th className="border-b border-slate-200 px-3 py-2">
                      {state.unit === "km" ? "Km totales" : "Pasos totales"}
                    </th>
                    <th className="border-b border-slate-200 px-3 py-2">
                      {state.unit === "km" ? "Media diaria (km)" : "Media diaria (pasos)"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {model.currentSorted.map((member, index) => (
                    <tr key={member.id} className={member.isUser ? "bg-[#f4f9ff]" : ""}>
                      <td className="border-b border-slate-100 px-3 py-2">{index + 1}º</td>
                      <td className="border-b border-slate-100 px-3 py-2 font-medium text-slate-900">
                        {member.name}
                        {member.isUser ? " (Tú)" : ""}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
                        {state.unit === "km"
                          ? `${kmFormat.format(member.currentKm)} km`
                          : `${formatSteps(member.currentSteps)} pasos`}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
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

          <Card className="mt-6 border-slate-200/80 bg-white">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Editar datos del equipo</CardTitle>
                <CardDescription>
                  Puedes introducir a mano los valores de cualquier miembro y el ranking se recalcula
                  al instante.
                </CardDescription>
              </div>

              <Button variant="outline" size="sm" onClick={resetTeamData}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar datos base
              </Button>
            </CardHeader>

            <CardContent className="overflow-x-auto pb-6">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-2">Miembro</th>
                    <th className="border-b border-slate-200 px-3 py-2">Km</th>
                    <th className="border-b border-slate-200 px-3 py-2">Pasos</th>
                    <th className="border-b border-slate-200 px-3 py-2">Actual</th>
                    <th className="border-b border-slate-200 px-3 py-2">Media diaria</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.map((member) => {
                    const currentMember = model.currentMembers.find((entry) => entry.id === member.id) ?? model.currentMembers[0];

                    return (
                      <tr key={member.id} className={member.isUser ? "bg-[#f4f9ff]" : ""}>
                        <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">
                          {member.name}
                          {member.isUser ? " (Tú)" : ""}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={member.km}
                            onChange={(event) => updateMember(member.id, "km", event.target.value)}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={member.steps}
                            onChange={(event) => updateMember(member.id, "steps", event.target.value)}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                          {formatValueByUnit(currentMember.currentSteps, state.unit, model.stepsPerKm, 1)}
                        </td>
                        <td className="border-b border-slate-100 px-3 py-3 text-slate-700">
                          {state.unit === "km"
                            ? `${kmFormat2.format(currentMember.currentDailyKm)} km`
                            : `${formatSteps(currentMember.currentDailySteps)} pasos`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section id="simulador" className="bg-[#18181a] py-12 text-white md:py-16">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mb-6">
              <h2 className="text-3xl font-semibold tracking-[-0.01em]">Simulador</h2>
              <p className="mt-3 max-w-4xl text-base leading-7 text-white/85">
                Ajusta el ritmo futuro y el escenario del equipo para proyectar el cierre del reto.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-white/[0.15] bg-white/[0.06] text-white">
                <CardHeader>
                  <CardTitle className="text-white">Control del escenario</CardTitle>
                  <CardDescription className="text-white/[0.72]">
                    El objetivo diario se adapta a la unidad visual seleccionada.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="goal-range" className="text-white/90">
                      Objetivo diario
                    </Label>
                    <Input
                      id="goal-range"
                      type="range"
                      min={unitInputMeta.min}
                      max={unitInputMeta.max}
                      step={unitInputMeta.step}
                      value={displayedGoal}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          dailyGoalSteps: clamp(
                            parseUnitInput(event.target.value, prev.unit, model.stepsPerKm),
                            10000,
                            35000
                          ),
                        }))
                      }
                      className="h-3 border-none bg-transparent px-0"
                    />
                    <Input
                      type="number"
                      min={unitInputMeta.min}
                      max={unitInputMeta.max}
                      step={unitInputMeta.step}
                      value={state.unit === "km" ? displayedGoal.toFixed(2) : Math.round(displayedGoal)}
                      onChange={(event) =>
                        setState((prev) => ({
                          ...prev,
                          dailyGoalSteps: clamp(
                            parseUnitInput(event.target.value, prev.unit, model.stepsPerKm),
                            10000,
                            35000
                          ),
                        }))
                      }
                      className="bg-white text-slate-900"
                    />
                    <p className="text-sm text-white/[0.72]">
                      {state.unit === "km"
                        ? `${formatSteps(state.dailyGoalSteps)} pasos/día`
                        : `${kmFormat2.format(stepsToKm(state.dailyGoalSteps, model.stepsPerKm))} km/día`}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="days-remaining" className="text-white/90">
                        Días restantes
                      </Label>
                      <Input
                        id="days-remaining"
                        type="number"
                        min={1}
                        max={60}
                        value={state.daysRemaining}
                        onChange={(event) =>
                          setState((prev) => {
                            const daysRemaining = clamp(Number(event.target.value) || 1, 1, 60);
                            return {
                              ...prev,
                              daysRemaining,
                              trendDay: clamp(prev.trendDay, 0, daysRemaining),
                            };
                          })
                        }
                        className="bg-white text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="others-mode" className="text-white/90">
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

                  <div className="rounded-xl border border-white/[0.12] bg-white/5 p-4">
                    <p className="text-sm text-white/75">Pasos hoy</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{formatSteps(TODAY_STEPS_FIXED)}</p>
                    <p className="mt-2 text-sm text-white/[0.65]">Valor fijo para el cálculo del modo real.</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-white">Microplan diario</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="block-morning" className="text-white/90">
                          Mañana
                        </Label>
                        <Input
                          id="block-morning"
                          type="number"
                          min={0}
                          step={unitInputMeta.step}
                          value={state.unit === "km" ? displayedMorning.toFixed(2) : Math.round(displayedMorning)}
                          onChange={(event) =>
                            setState((prev) => ({
                              ...prev,
                              blockMorning: Math.max(
                                parseUnitInput(event.target.value, prev.unit, model.stepsPerKm),
                                0
                              ),
                            }))
                          }
                          className="bg-white text-slate-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="block-treadmill" className="text-white/90">
                          Cinta
                        </Label>
                        <Input
                          id="block-treadmill"
                          type="number"
                          min={0}
                          step={unitInputMeta.step}
                          value={
                            state.unit === "km"
                              ? displayedTreadmill.toFixed(2)
                              : Math.round(displayedTreadmill)
                          }
                          onChange={(event) =>
                            setState((prev) => ({
                              ...prev,
                              blockTreadmill: Math.max(
                                parseUnitInput(event.target.value, prev.unit, model.stepsPerKm),
                                0
                              ),
                            }))
                          }
                          className="bg-white text-slate-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="block-evening" className="text-white/90">
                          Tarde
                        </Label>
                        <Input
                          id="block-evening"
                          type="number"
                          min={0}
                          step={unitInputMeta.step}
                          value={state.unit === "km" ? displayedEvening.toFixed(2) : Math.round(displayedEvening)}
                          onChange={(event) =>
                            setState((prev) => ({
                              ...prev,
                              blockEvening: Math.max(
                                parseUnitInput(event.target.value, prev.unit, model.stepsPerKm),
                                0
                              ),
                            }))
                          }
                          className="bg-white text-slate-900"
                        />
                      </div>
                    </div>

                    <p className="rounded-xl border border-white/[0.12] bg-white/5 px-4 py-3 text-sm text-white/[0.82]">
                      {model.microPlanStatus}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.12] bg-white/5 p-4 text-sm text-white/[0.85]">
                    <p>
                      <strong>Factor de conversión del equipo:</strong> 1 km ≈{" "}
                      {formatSteps(model.stepsPerKm)} pasos
                    </p>
                    <p className="mt-2">
                      <strong>Equivalencia inversa:</strong> 1.000 pasos ≈{" "}
                      {kmFormat2.format(stepsToKm(1000, model.stepsPerKm))} km
                    </p>
                    <p className="mt-2">
                      <strong>Rango observado entre miembros:</strong>{" "}
                      {formatSteps(model.conversionMin)} - {formatSteps(model.conversionMax)} pasos/km
                    </p>
                    <p className="mt-2">
                      <strong>Tu objetivo diario actual:</strong>{" "}
                      {formatSteps(state.dailyGoalSteps)} pasos ≈{" "}
                      {kmFormat2.format(stepsToKm(state.dailyGoalSteps, model.stepsPerKm))} km
                    </p>
                    <p className="mt-2">
                      <strong>Modo real D20+:</strong>{" "}
                      {state.realMode
                        ? `Activo · se descuentan ${formatSteps(model.userBaselineSteps)} pasos (${kmFormat2.format(
                            stepsToKm(model.userBaselineSteps, model.stepsPerKm)
                          )} km)`
                        : "Desactivado · se usan tus acumulados históricos"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <MetricCard
                    dark
                    title="A sumar hasta el cierre"
                    value={formatValueByUnit(
                      state.dailyGoalSteps * state.daysRemaining,
                      state.unit,
                      model.stepsPerKm,
                      1
                    )}
                    subtitle={`si mantienes ${formatValueByUnit(state.dailyGoalSteps, state.unit, model.stepsPerKm, 2)}/día`}
                  />
                  <MetricCard
                    dark
                    title="Total final estimado"
                    value={formatValueByUnit(model.user.finalSteps, state.unit, model.stepsPerKm, 1)}
                    subtitle={`${model.user.name} al cierre`}
                  />
                  <MetricCard
                    dark
                    title="Posición final"
                    value={`${model.projectedPosition}º`}
                    subtitle={`contra ${teamData.length} miembros`}
                  />
                  <MetricCard
                    dark
                    title="Media final real"
                    value={formatValueByUnit(
                      model.userFinalDailyRealSteps,
                      state.unit,
                      model.stepsPerKm,
                      2
                    )}
                    subtitle={
                      state.realMode
                        ? `${state.unit === "km" ? "km" : "pasos"}/día desde 20/04`
                        : `${state.unit === "km" ? "km" : "pasos"}/día en toda la competición`
                    }
                  />
                  <MetricCard
                    dark
                    title="Media final equipo"
                    value={formatValueByUnit(
                      model.finalTeamMeanSteps,
                      state.unit,
                      model.stepsPerKm,
                      1
                    )}
                    subtitle={`${state.unit === "km" ? "km" : "pasos"} por miembro`}
                  />
                  <MetricCard
                    dark
                    title="Subida directa media"
                    value={`+${formatValueByUnit(model.directMeanLiftSteps, state.unit, model.stepsPerKm, 2)}`}
                    subtitle="por tus pasos futuros"
                  />
                  <MetricCard
                    dark
                    title={state.realMode ? "Mejora vs ritmo real" : "Mejora vs ritmo histórico"}
                    value={`+${formatValueByUnit(
                      model.liftVsCurrentRateSteps,
                      state.unit,
                      model.stepsPerKm,
                      2
                    )}`}
                    subtitle="media del equipo recuperada"
                  />
                </div>

                <Card className="border-white/[0.15] bg-white/[0.06] text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Proyección del equipo</CardTitle>
                    <CardDescription className="text-white/[0.72]">
                      Comparativa final estimada para todo el grupo.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {model.sortedProjected.map((member) => {
                      const maxValue = model.sortedProjected[0]?.finalSteps || 1;
                      const width = (member.finalSteps / maxValue) * 100;

                      return (
                        <div key={member.id} className="grid gap-2 md:grid-cols-[minmax(160px,220px)_1fr_auto] md:items-center">
                          <div className="text-sm text-white/[0.86]">
                            {member.name}
                            {member.isUser ? " (Tú)" : ""}
                          </div>
                          <div className="h-4 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={member.isUser ? "h-full rounded-full bg-[#0071e3]" : "h-full rounded-full bg-white/45"}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <div className="text-xs text-white/70">
                            {formatValueByUnit(member.finalSteps, state.unit, model.stepsPerKm, 1)}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="border-white/[0.15] bg-white/[0.06] text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Adelantamientos probables</CardTitle>
                    <CardDescription className="text-white/[0.72]">
                      Fechas estimadas con el ritmo configurado.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="grid gap-2">
                      {model.overtakeTimeline.map((item) => (
                        <li
                          key={item.name}
                          className="rounded-xl border border-white/[0.12] bg-white/5 px-4 py-3 text-sm text-white/[0.82]"
                        >
                          <strong>{item.name}</strong>: {item.status}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section id="tendencia" className="mx-auto max-w-6xl px-5 py-12 md:py-16">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[#1d1d1f]">
              Tendencia y distancias
            </h2>
            <p className="mt-3 max-w-4xl text-base leading-7 text-[#333336]">
              El gráfico y las brechas se recalculan con el día proyectado seleccionado.
            </p>
          </div>

          <div className="space-y-5">
            <div className="max-w-sm">
              <Label htmlFor="trend-day-live">Día proyectado</Label>
              <Input
                id="trend-day-live"
                type="range"
                min={0}
                max={state.daysRemaining}
                value={state.trendDay}
                onChange={(event) =>
                  setState((prev) => ({ ...prev, trendDay: Number(event.target.value) }))
                }
                className="mt-2 h-3 border-none bg-transparent px-0"
              />
            </div>

            <TrendChart state={state} model={model} />

            <Card className="border-slate-200/80 bg-white">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Distancias más próximas</CardTitle>
                  <CardDescription>
                    Comparativa respecto al resto del equipo en el día seleccionado.
                  </CardDescription>
                </div>

                <div className="inline-flex overflow-hidden rounded-full border border-slate-200">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm ${state.gapMode === "steps" ? "bg-[#1d1d1f] text-white" : "bg-white text-[#333336]"}`}
                    onClick={() => setState((prev) => ({ ...prev, gapMode: "steps" }))}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm ${state.gapMode === "daily" ? "bg-[#1d1d1f] text-white" : "bg-white text-[#333336]"}`}
                    onClick={() => setState((prev) => ({ ...prev, gapMode: "daily" }))}
                  >
                    Diario
                  </button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {model.visibleGaps.map((entry) => {
                  const rawSteps = state.gapMode === "daily" ? entry.dailyStepsGap : entry.stepsGap;
                  const rawValue =
                    state.unit === "km" ? stepsToKm(rawSteps, model.stepsPerKm) : rawSteps;
                  const maxAbs = Math.max(
                    ...model.visibleGaps.map((gap) => {
                      const value = state.gapMode === "daily" ? gap.dailyStepsGap : gap.stepsGap;
                      return Math.abs(
                        state.unit === "km" ? stepsToKm(value, model.stepsPerKm) : value
                      );
                    }),
                    1
                  );
                  const width = (Math.abs(rawValue) / maxAbs) * 100;
                  const isPositive = rawValue > 0;
                  const suffix =
                    state.gapMode === "daily"
                      ? state.unit === "km"
                        ? "km/día"
                        : "pasos/día"
                      : state.unit === "km"
                        ? "km"
                        : "pasos";

                  const label =
                    state.unit === "km"
                      ? `${rawValue > 0 ? "+" : ""}${kmFormat2.format(rawValue)} ${suffix}`
                      : `${rawValue > 0 ? "+" : ""}${formatSteps(rawValue)} ${suffix}`;

                  return (
                    <div key={`${entry.name}-${state.gapMode}`} className="grid gap-2 md:grid-cols-[minmax(140px,180px)_1fr_auto] md:items-center">
                      <div className="text-sm text-slate-700">{entry.name}</div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#f1f1f4]">
                        <div
                          className={isPositive ? "h-full rounded-full bg-[#8b8b92]" : "h-full rounded-full bg-[#0071e3]"}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500">{label}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-sm text-slate-500">
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
