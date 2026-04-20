const TEAM_DATA = [
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

const COMPETITION = {
  currentDate: new Date("2026-04-20T14:54:00"),
  daysElapsed: 8,
};

const STEPS_PER_KM =
  TEAM_DATA.reduce((sum, member) => sum + member.steps, 0) /
  TEAM_DATA.reduce((sum, member) => sum + member.km, 0);
const KM_PER_STEP = 1 / STEPS_PER_KM;

const TEAM_STEP_PER_KM_VALUES = TEAM_DATA.map((member) => member.steps / member.km);
const CONVERSION_MIN = Math.min(...TEAM_STEP_PER_KM_VALUES);
const CONVERSION_MAX = Math.max(...TEAM_STEP_PER_KM_VALUES);

const numberFormat = new Intl.NumberFormat("es-ES");
const km1Format = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const km2Format = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
});

const USER_REAL_START_DATE = new Date("2026-04-20T00:00:00");
const REDUCED_MOTION_QUERY = window.matchMedia("(prefers-reduced-motion: reduce)");

const refs = {
  siteHeader: document.getElementById("site-header"),
  sortBySelect: document.getElementById("sort-by"),
  tableBody: document.getElementById("team-table-body"),
  thTotal: document.getElementById("th-total"),
  thDaily: document.getElementById("th-daily"),
  unitModeInput: document.getElementById("unit-mode"),
  realModeToggle: document.getElementById("real-mode-toggle"),
  kpiGrid: document.getElementById("kpi-grid"),
  heroMetrics: document.getElementById("hero-metrics"),
  heroVideo: document.getElementById("hero-video"),
  heroShaderCanvas: document.getElementById("hero-shader"),
  projectionKpis: document.getElementById("projection-kpis"),
  projectionBars: document.getElementById("projection-bars"),
  overtakeList: document.getElementById("overtake-list"),
  dailyGoalInput: document.getElementById("daily-goal"),
  dailyGoalNumberInput: document.getElementById("daily-goal-number"),
  dailyGoalValue: document.getElementById("daily-goal-value"),
  dailyGoalConverted: document.getElementById("daily-goal-converted"),
  conversionBox: document.getElementById("conversion-box"),
  daysRemainingInput: document.getElementById("days-remaining"),
  othersModeInput: document.getElementById("others-mode"),
  todayStepsInput: document.getElementById("today-steps"),
  blockMorningInput: document.getElementById("block-morning"),
  blockTreadmillInput: document.getElementById("block-treadmill"),
  blockEveningInput: document.getElementById("block-evening"),
  microPlanStatus: document.getElementById("micro-plan-status"),
  trendDayInput: document.getElementById("trend-day"),
  trendDayLabel: document.getElementById("trend-day-label"),
  trendChart: document.getElementById("trend-chart"),
  trendLegend: document.getElementById("trend-legend"),
  gapBars: document.getElementById("gap-bars"),
  gapButtons: Array.from(document.querySelectorAll("[data-gap-mode]")),
  scrollTopButton: document.getElementById("scroll-top-btn"),
};

const user = TEAM_DATA.find((member) => member.isUser);

function formatSteps(value) {
  return numberFormat.format(Math.round(value));
}

function formatKm(value, digits = 1) {
  return digits === 1 ? km1Format.format(value) : km2Format.format(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getInclusiveDaySpan(startDate, endDate) {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const millis = end.getTime() - start.getTime();
  const days = Math.floor(millis / 86400000) + 1;
  return Math.max(days, 1);
}

function getOthersFactor(mode) {
  if (mode === "freeze") return 0;
  if (mode === "plus10") return 1.1;
  return 1;
}

function stepsToKm(steps) {
  return steps * KM_PER_STEP;
}

function kmToSteps(km) {
  return km * STEPS_PER_KM;
}

function getEffectiveUserBaselineSteps(todaySteps) {
  return clamp(user.steps - Math.max(todaySteps, 0), 0, user.steps);
}

function formatValueByUnit(valueSteps, unit, digits = 1) {
  if (unit === "km") {
    return `${formatKm(stepsToKm(valueSteps), digits)} km`;
  }
  return `${formatSteps(valueSteps)} pasos`;
}

function createStore(initialState) {
  let state = initialState;
  let frameId = null;
  const listeners = new Set();

  const flush = () => {
    frameId = null;
    listeners.forEach((listener) => listener(state));
  };

  const scheduleFlush = () => {
    if (frameId !== null) return;
    frameId = requestAnimationFrame(flush);
  };

  return {
    get() {
      return state;
    },
    set(patch) {
      state = { ...state, ...patch };
      scheduleFlush();
    },
    update(updater) {
      state = updater(state);
      scheduleFlush();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
}

function buildOvertakeTimeline(state, othersFactor, userCurrentSteps) {
  const result = [];

  TEAM_DATA.filter((member) => !member.isUser).forEach((member) => {
    const otherRateSteps = (member.steps / COMPETITION.daysElapsed) * othersFactor;

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
        status: "despues del fin del reto",
        day: null,
      });
      return;
    }

    const date = new Date(COMPETITION.currentDate);
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

function deriveModel(state) {
  const othersFactor = getOthersFactor(state.othersMode);
  const realDaysElapsed = getInclusiveDaySpan(USER_REAL_START_DATE, COMPETITION.currentDate);
  const userBaselineSteps = state.realMode ? getEffectiveUserBaselineSteps(state.todaySteps) : 0;
  const userDaysElapsed = state.realMode ? realDaysElapsed : COMPETITION.daysElapsed;

  const projectedMembers = TEAM_DATA.map((member) => {
    const currentSteps = member.isUser
      ? Math.max(member.steps - userBaselineSteps, 0)
      : member.steps;
    const currentKm = member.isUser ? stepsToKm(currentSteps) : member.km;
    const currentDays = member.isUser ? userDaysElapsed : COMPETITION.daysElapsed;
    const currentDailySteps = currentSteps / currentDays;
    const currentDailyKm = currentKm / currentDays;

    const rateSteps = member.isUser
      ? state.dailyGoalSteps
      : currentDailySteps * othersFactor;
    const rateKm = member.isUser ? stepsToKm(state.dailyGoalSteps) : currentDailyKm * othersFactor;

    return {
      ...member,
      currentSteps,
      currentKm,
      currentDays,
      currentDailySteps,
      currentDailyKm,
      rateSteps,
      rateKm,
      finalSteps: currentSteps + rateSteps * state.daysRemaining,
      finalKm: currentKm + rateKm * state.daysRemaining,
    };
  });

  const sortedProjected = [...projectedMembers].sort(
    (a, b) => b.finalSteps - a.finalSteps
  );

  const userProjected =
    sortedProjected.find((member) => member.isUser) ||
    projectedMembers.find((member) => member.isUser);
  const userPosition = sortedProjected.findIndex((member) => member.isUser) + 1;
  const userCurrentSteps = userProjected.currentSteps;

  const finalTeamTotalSteps = sortedProjected.reduce(
    (sum, member) => sum + member.finalSteps,
    0
  );
  const finalTeamMeanSteps = finalTeamTotalSteps / sortedProjected.length;
  const totalDays = userDaysElapsed + state.daysRemaining;
  const userFinalDailyRealSteps = userProjected.finalSteps / totalDays;

  const directMeanLiftSteps =
    (state.dailyGoalSteps * state.daysRemaining) / TEAM_DATA.length;
  const liftVsCurrentRateSteps =
    ((state.dailyGoalSteps - userProjected.currentDailySteps) * state.daysRemaining) /
    TEAM_DATA.length;

  const teamTotalCurrentSteps = projectedMembers.reduce(
    (sum, member) => sum + member.currentSteps,
    0
  );
  const teamMeanCurrentSteps = teamTotalCurrentSteps / TEAM_DATA.length;
  const teamMeanWithoutUserSteps =
    (teamTotalCurrentSteps - userCurrentSteps) / (TEAM_DATA.length - 1);
  const penaltySteps = teamMeanWithoutUserSteps - teamMeanCurrentSteps;

  const trendSeries = [];
  for (let day = 0; day <= state.daysRemaining; day += 1) {
    const points = projectedMembers.map((member) => ({
      ...member,
      atDaySteps: member.currentSteps + member.rateSteps * day,
    }));

    const userAtDaySteps = points.find((member) => member.isUser).atDaySteps;
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

  const selectedDay = clamp(state.trendDay, 0, state.daysRemaining);
  const selectedTrend = trendSeries[selectedDay];

  const gaps = projectedMembers
    .filter((member) => !member.isUser)
    .map((member) => {
      const memberAtDaySteps = member.currentSteps + member.rateSteps * selectedDay;
      const userAtDaySteps = userCurrentSteps + state.dailyGoalSteps * selectedDay;
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

  return {
    state,
    realDaysElapsed,
    userBaselineSteps,
    userCurrentSteps,
    userCurrentKm: userProjected.currentKm,
    currentMembers: projectedMembers,
    teamMeanCurrentSteps,
    teamMeanWithoutUserSteps,
    penaltySteps,
    sortedProjected,
    userProjected,
    userPosition,
    finalTeamMeanSteps,
    userFinalDailyRealSteps,
    directMeanLiftSteps,
    liftVsCurrentRateSteps,
    trendSeries,
    selectedTrend,
    visibleGaps,
    overtakeTimeline: buildOvertakeTimeline(state, othersFactor, userCurrentSteps),
  };
}

function renderHeroMetrics(model) {
  const totalLabel = model.state.realMode ? "Total real D20+" : "Total actual";
  refs.heroMetrics.innerHTML = `
    <article class="metric-chip">
      <h3>${totalLabel}</h3>
      <p>${formatValueByUnit(model.userCurrentSteps, model.state.unit, 1)}</p>
    </article>
    <article class="metric-chip">
      <h3>Posicion estimada final</h3>
      <p>${model.userPosition}º</p>
    </article>
    <article class="metric-chip">
      <h3>Ritmo hoy</h3>
      <p>${formatValueByUnit(model.state.todaySteps, model.state.unit, 2)}</p>
    </article>
  `;
}

function renderTableHeaders(unit) {
  refs.thTotal.textContent = unit === "km" ? "Km Totales" : "Pasos Totales";
  refs.thDaily.textContent = unit === "km" ? "Media Diaria (Km)" : "Media Diaria (Pasos)";
}

function renderTeamTable(state, model) {
  const sorted = [...model.currentMembers].sort((a, b) => {
    if (state.sortBy === "daily") {
      const aDaily = state.unit === "km" ? a.currentDailyKm : a.currentDailySteps;
      const bDaily = state.unit === "km" ? b.currentDailyKm : b.currentDailySteps;
      return bDaily - aDaily;
    }
    if (state.sortBy === "name") return a.name.localeCompare(b.name, "es");
    return state.unit === "km" ? b.currentKm - a.currentKm : b.currentSteps - a.currentSteps;
  });

  refs.tableBody.innerHTML = sorted
    .map((member, index) => {
      const rowClass = member.isUser ? "user-row" : "";
      const totalValue =
        state.unit === "km" ? formatKm(member.currentKm, 1) : formatSteps(member.currentSteps);
      const dailyValue =
        state.unit === "km"
          ? formatKm(member.currentDailyKm, 2)
          : formatSteps(member.currentDailySteps);

      return `
        <tr class="${rowClass}">
          <td>${index + 1}º</td>
          <td>${member.name}${member.isUser ? " (Tu)" : ""}</td>
          <td>${totalValue}</td>
          <td>${dailyValue}</td>
        </tr>
      `;
    })
    .join("");
}

function renderCurrentKpis(model) {
  const unit = model.state.unit;
  const currentMean =
    unit === "km" ? stepsToKm(model.teamMeanCurrentSteps) : model.teamMeanCurrentSteps;
  const meanWithoutUser =
    unit === "km"
      ? stepsToKm(model.teamMeanWithoutUserSteps)
      : model.teamMeanWithoutUserSteps;
  const penalty = unit === "km" ? stepsToKm(model.penaltySteps) : model.penaltySteps;
  const today = unit === "km" ? stepsToKm(model.state.todaySteps) : model.state.todaySteps;

  refs.kpiGrid.innerHTML = `
    <article class="kpi-card">
      <h3>Media actual (12)</h3>
      <p>${unit === "km" ? formatKm(currentMean, 1) : formatSteps(currentMean)}</p>
      <div class="kpi-sub">${unit === "km" ? "km" : "pasos"} por miembro</div>
    </article>
    <article class="kpi-card">
      <h3>Media sin ti (11)</h3>
      <p>${unit === "km" ? formatKm(meanWithoutUser, 1) : formatSteps(meanWithoutUser)}</p>
      <div class="kpi-sub">${unit === "km" ? "km" : "pasos"} por miembro</div>
    </article>
    <article class="kpi-card">
      <h3>Impacto actual</h3>
      <p>-${unit === "km" ? formatKm(penalty, 1) : formatSteps(penalty)}</p>
      <div class="kpi-sub">penalizacion por entrada tardia</div>
    </article>
    <article class="kpi-card">
      <h3>Ritmo hoy</h3>
      <p>${unit === "km" ? formatKm(today, 2) : formatSteps(today)}</p>
      <div class="kpi-sub">${unit === "km" ? "km" : "pasos"} reportados hoy</div>
    </article>
  `;
}

function renderProjectionKpis(model) {
  const unit = model.state.unit;
  const increment = model.state.dailyGoalSteps * model.state.daysRemaining;
  const finalDailyLabel = model.state.realMode
    ? `${unit === "km" ? "km" : "pasos"}/dia desde 20/04`
    : `${unit === "km" ? "km" : "pasos"}/dia en toda la competicion`;
  const liftHeading = model.state.realMode
    ? "Mejora vs ritmo real"
    : "Mejora vs ritmo historico";

  const incrementValue = unit === "km" ? formatKm(stepsToKm(increment), 1) : formatSteps(increment);
  const totalFinalValue =
    unit === "km"
      ? formatKm(model.userProjected.finalKm, 1)
      : formatSteps(model.userProjected.finalSteps);
  const userFinalDailyValue =
    unit === "km"
      ? formatKm(stepsToKm(model.userFinalDailyRealSteps), 2)
      : formatSteps(model.userFinalDailyRealSteps);
  const finalTeamMeanValue =
    unit === "km"
      ? formatKm(stepsToKm(model.finalTeamMeanSteps), 1)
      : formatSteps(model.finalTeamMeanSteps);
  const directMeanLift =
    unit === "km"
      ? formatKm(stepsToKm(model.directMeanLiftSteps), 2)
      : formatSteps(model.directMeanLiftSteps);
  const liftVsCurrent =
    unit === "km"
      ? formatKm(stepsToKm(model.liftVsCurrentRateSteps), 2)
      : formatSteps(model.liftVsCurrentRateSteps);

  refs.projectionKpis.innerHTML = `
    <article class="kpi-card dark">
      <h3>A sumar hasta el cierre</h3>
      <p>${incrementValue}</p>
      <div class="kpi-sub">si mantienes ${formatValueByUnit(model.state.dailyGoalSteps, unit, 2)}/dia</div>
    </article>
    <article class="kpi-card dark">
      <h3>Total final estimado</h3>
      <p>${totalFinalValue}</p>
      <div class="kpi-sub">Antonio al cierre</div>
    </article>
    <article class="kpi-card dark">
      <h3>Posicion final</h3>
      <p>${model.userPosition}º</p>
      <div class="kpi-sub">contra 12 miembros</div>
    </article>
    <article class="kpi-card dark">
      <h3>Media final real</h3>
      <p>${userFinalDailyValue}</p>
      <div class="kpi-sub">${finalDailyLabel}</div>
    </article>
    <article class="kpi-card dark">
      <h3>Media final equipo</h3>
      <p>${finalTeamMeanValue}</p>
      <div class="kpi-sub">${unit === "km" ? "km" : "pasos"} por miembro</div>
    </article>
    <article class="kpi-card dark">
      <h3>Subida directa media</h3>
      <p>+${directMeanLift}</p>
      <div class="kpi-sub">por tus pasos futuros</div>
    </article>
    <article class="kpi-card dark">
      <h3>${liftHeading}</h3>
      <p>+${liftVsCurrent}</p>
      <div class="kpi-sub">media del equipo recuperada</div>
    </article>
  `;
}

function renderProjectionBars(model) {
  const unit = model.state.unit;
  const maxValue =
    unit === "km"
      ? Math.max(...model.sortedProjected.map((member) => member.finalKm))
      : Math.max(...model.sortedProjected.map((member) => member.finalSteps));

  refs.projectionBars.innerHTML = model.sortedProjected
    .map((member) => {
      const value = unit === "km" ? member.finalKm : member.finalSteps;
      const width = (value / (maxValue || 1)) * 100;
      const valueLabel = unit === "km" ? `${formatKm(value, 1)} km` : `${formatSteps(value)} pasos`;

      return `
        <div class="bar-row ${member.isUser ? "user" : ""}">
          <div class="bar-label">${member.name}${member.isUser ? " (Tu)" : ""}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
          <div class="bar-value">${valueLabel}</div>
        </div>
      `;
    })
    .join("");
}

function createLinePath(points, key, maxDay, minValue, maxValue) {
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
      const y = height - padY - ((point[key] - minValue) / valueRange) * ySpan;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function renderTrendChart(model) {
  const unit = model.state.unit;
  const series = model.trendSeries.map((point) => ({
    ...point,
    user: unit === "km" ? stepsToKm(point.userSteps) : point.userSteps,
    teamMean: unit === "km" ? stepsToKm(point.teamMeanSteps) : point.teamMeanSteps,
    leader: unit === "km" ? stepsToKm(point.leaderSteps) : point.leaderSteps,
  }));

  const maxDay = model.state.daysRemaining;
  const maxValue = Math.max(...series.map((point) => point.leader));
  const minValue = Math.min(...series.map((point) => Math.min(point.user, point.teamMean)));

  const width = 920;
  const height = 320;
  const padX = 52;
  const padY = 24;
  const xSpan = width - padX * 2;
  const ySpan = height - padY * 2;
  const valueRange = maxValue - minValue || 1;

  const userPath = createLinePath(series, "user", maxDay, minValue, maxValue);
  const teamPath = createLinePath(series, "teamMean", maxDay, minValue, maxValue);
  const leaderPath = createLinePath(series, "leader", maxDay, minValue, maxValue);

  const selected = series[model.selectedTrend.day];
  const selectedX = padX + (selected.day / (maxDay || 1)) * xSpan;
  const selectedUserY =
    height - padY - ((selected.user - minValue) / valueRange) * ySpan;
  const selectedTeamY =
    height - padY - ((selected.teamMean - minValue) / valueRange) * ySpan;
  const selectedLeaderY =
    height - padY - ((selected.leader - minValue) / valueRange) * ySpan;

  const horizontalGrid = Array.from({ length: 5 }, (_, idx) => {
    const ratio = idx / 4;
    const y = padY + ratio * ySpan;
    const value = maxValue - ratio * valueRange;
    const label = unit === "km" ? formatKm(value, 1) : formatSteps(value);

    return `
      <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="#E8E8ED" stroke-width="1" />
      <text x="8" y="${y + 4}" font-size="11" fill="#6E6E73">${label}</text>
    `;
  }).join("");

  const verticalGrid = Array.from({ length: 6 }, (_, idx) => {
    const ratio = idx / 5;
    const day = Math.round(ratio * maxDay);
    const x = padX + ratio * xSpan;
    return `
      <line x1="${x}" y1="${padY}" x2="${x}" y2="${height - padY}" stroke="#F1F1F4" stroke-width="1" />
      <text x="${x}" y="${height - 4}" text-anchor="middle" font-size="11" fill="#6E6E73">D${day}</text>
    `;
  }).join("");

  refs.trendChart.innerHTML = `
    ${horizontalGrid}
    ${verticalGrid}
    <line x1="${selectedX}" y1="${padY}" x2="${selectedX}" y2="${height - padY}" stroke="#0071E3" stroke-width="1.5" stroke-dasharray="4 4" />
    <path d="${leaderPath}" fill="none" stroke="#6E6E73" stroke-width="2.5" />
    <path d="${teamPath}" fill="none" stroke="#333336" stroke-width="2.5" />
    <path d="${userPath}" fill="none" stroke="#0071E3" stroke-width="3" />
    <circle cx="${selectedX}" cy="${selectedLeaderY}" r="5" fill="#6E6E73" />
    <circle cx="${selectedX}" cy="${selectedTeamY}" r="5" fill="#333336" />
    <circle cx="${selectedX}" cy="${selectedUserY}" r="6" fill="#0071E3" />
  `;

  const selectedDate = new Date(COMPETITION.currentDate);
  selectedDate.setDate(selectedDate.getDate() + selected.day);

  refs.trendDayLabel.textContent =
    `Dia ${selected.day} de ${maxDay} · ${dateFormat.format(selectedDate)} · Puesto ${model.selectedTrend.rank}º`;

  refs.trendLegend.innerHTML = `
    <article class="trend-pill dot-user">
      <h4>Antonio acumulado</h4>
      <p>${unit === "km" ? `${formatKm(selected.user, 1)} km` : `${formatSteps(selected.user)} pasos`}</p>
    </article>
    <article class="trend-pill dot-team">
      <h4>Media del equipo</h4>
      <p>${unit === "km" ? `${formatKm(selected.teamMean, 1)} km` : `${formatSteps(selected.teamMean)} pasos`}</p>
    </article>
    <article class="trend-pill dot-leader">
      <h4>Lider acumulado</h4>
      <p>${unit === "km" ? `${formatKm(selected.leader, 1)} km` : `${formatSteps(selected.leader)} pasos`}</p>
    </article>
  `;
}

function renderGapBars(model) {
  const unit = model.state.unit;
  const key = model.state.gapMode === "daily" ? "dailyStepsGap" : "stepsGap";

  const values = model.visibleGaps.map((entry) =>
    unit === "km" ? stepsToKm(entry[key]) : entry[key]
  );
  const maxAbs = Math.max(...values.map((value) => Math.abs(value)), 1);

  refs.gapBars.innerHTML = model.visibleGaps
    .map((entry) => {
      const rawSteps = entry[key];
      const rawValue = unit === "km" ? stepsToKm(rawSteps) : rawSteps;
      const width = (Math.abs(rawValue) / maxAbs) * 100;
      const directionClass = rawValue > 0 ? "gap-positive" : "gap-negative";
      const sign = rawValue > 0 ? "+" : "";

      const suffix =
        model.state.gapMode === "daily"
          ? unit === "km"
            ? "km/dia"
            : "pasos/dia"
          : unit === "km"
            ? "km"
            : "pasos";

      const valueLabel = unit === "km" ? formatKm(rawValue, 2) : formatSteps(rawValue);

      return `
        <div class="gap-row">
          <div class="gap-name">${entry.name}</div>
          <div class="gap-track">
            <div class="gap-fill ${directionClass}" style="width:${width}%"></div>
          </div>
          <div class="gap-value">${sign}${valueLabel} ${suffix}</div>
        </div>
      `;
    })
    .join("");
}

function renderOvertakeList(model) {
  refs.overtakeList.innerHTML = model.overtakeTimeline
    .map((item) => `<li><strong>${item.name}</strong>: ${item.status}</li>`)
    .join("");
}

function renderMicroPlan(state) {
  const totalBlocks = state.blockMorning + state.blockTreadmill + state.blockEvening;
  const diff = totalBlocks - state.dailyGoalSteps;
  const totalLabel = formatValueByUnit(totalBlocks, state.unit, 2);

  if (diff === 0) {
    refs.microPlanStatus.textContent =
      `Plan perfecto: ${totalLabel} (objetivo clavado).`;
    return;
  }

  if (diff > 0) {
    refs.microPlanStatus.textContent =
      `Plan exigente: te sobran ${formatValueByUnit(diff, state.unit, 2)} sobre el objetivo.`;
    return;
  }

  refs.microPlanStatus.textContent =
    `Te faltan ${formatValueByUnit(Math.abs(diff), state.unit, 2)} para llegar al objetivo diario.`;
}

function renderConversionBox(state) {
  const goalKm = stepsToKm(state.dailyGoalSteps);
  const thousandStepsKm = stepsToKm(1000);
  const baselineSteps = getEffectiveUserBaselineSteps(state.todaySteps);
  const baselineKm = stepsToKm(baselineSteps);
  const modeSummary = state.realMode
    ? `Activo · se descuentan ${formatSteps(baselineSteps)} pasos (${formatKm(baselineKm, 2)} km)`
    : "Desactivado · se usan tus acumulados historicos";

  refs.conversionBox.innerHTML = `
    <p><strong>Factor de conversion del equipo:</strong> 1 km ≈ ${formatSteps(STEPS_PER_KM)} pasos</p>
    <p><strong>Equivalencia inversa:</strong> 1.000 pasos ≈ ${formatKm(thousandStepsKm, 2)} km</p>
    <p><strong>Rango observado entre miembros:</strong> ${formatSteps(CONVERSION_MIN)} - ${formatSteps(CONVERSION_MAX)} pasos/km</p>
    <p><strong>Tu objetivo diario actual:</strong> ${formatSteps(state.dailyGoalSteps)} pasos ≈ ${formatKm(goalKm, 2)} km</p>
    <p><strong>Modo real D20+:</strong> ${modeSummary}</p>
  `;
}

function syncGoalControls(state) {
  const unit = state.unit;

  if (unit === "km") {
    const goalKm = stepsToKm(state.dailyGoalSteps);
    refs.dailyGoalInput.min = "7";
    refs.dailyGoalInput.max = "30";
    refs.dailyGoalInput.step = "0.1";
    refs.dailyGoalInput.value = goalKm.toFixed(1);

    refs.dailyGoalNumberInput.min = "7";
    refs.dailyGoalNumberInput.max = "30";
    refs.dailyGoalNumberInput.step = "0.1";
    refs.dailyGoalNumberInput.value = goalKm.toFixed(2);

    refs.dailyGoalValue.textContent = `${formatKm(goalKm, 2)} km/dia`;
    refs.dailyGoalConverted.textContent = `${formatSteps(state.dailyGoalSteps)} pasos/dia`;
    return;
  }

  refs.dailyGoalInput.min = "10000";
  refs.dailyGoalInput.max = "35000";
  refs.dailyGoalInput.step = "500";
  refs.dailyGoalInput.value = String(Math.round(state.dailyGoalSteps));

  refs.dailyGoalNumberInput.min = "10000";
  refs.dailyGoalNumberInput.max = "35000";
  refs.dailyGoalNumberInput.step = "500";
  refs.dailyGoalNumberInput.value = String(Math.round(state.dailyGoalSteps));

  refs.dailyGoalValue.textContent = `${formatSteps(state.dailyGoalSteps)} pasos/dia`;
  refs.dailyGoalConverted.textContent = `${formatKm(stepsToKm(state.dailyGoalSteps), 2)} km/dia`;
}

function syncControls(state) {
  refs.trendDayInput.max = String(state.daysRemaining);

  if (Number(refs.trendDayInput.value) !== state.trendDay) {
    refs.trendDayInput.value = String(state.trendDay);
  }

  if (refs.unitModeInput.value !== state.unit) {
    refs.unitModeInput.value = state.unit;
  }

  if (refs.realModeToggle) {
    refs.realModeToggle.classList.toggle("is-active", state.realMode);
    refs.realModeToggle.setAttribute("aria-pressed", String(state.realMode));
  }

  renderTableHeaders(state.unit);
  syncGoalControls(state);
}

function renderApp(state) {
  const model = deriveModel(state);
  syncControls(state);
  renderHeroMetrics(model);
  renderTeamTable(state, model);
  renderCurrentKpis(model);
  renderProjectionKpis(model);
  renderProjectionBars(model);
  renderTrendChart(model);
  renderGapBars(model);
  renderOvertakeList(model);
  renderMicroPlan(state);
  renderConversionBox(state);

  refs.gapButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.gapMode === state.gapMode);
  });
}

function initHeroVideo() {
  const video = refs.heroVideo;
  if (!video) return;

  video.playbackRate = 0.92;
  const playAttempt = video.play();
  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch(() => {});
  }
}

function initHeroShader() {
  const canvas = refs.heroShaderCanvas;
  const heroSection = document.querySelector(".hero");

  if (!canvas || !heroSection || REDUCED_MOTION_QUERY.matches) {
    return;
  }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    premultipliedAlpha: true,
  });

  if (!gl) return;

  const vertexSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;

      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = p * 2.03 + vec2(21.7, 9.2);
        amplitude *= 0.5;
      }

      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * 2.0;
      float t = u_time * 0.09;

      float waveA = fbm(p * 2.7 + vec2(t, -t * 0.6));
      float waveB = fbm(vec2(p.x * 4.0 - t * 0.8, p.y * 1.9 + t * 0.3));
      float caustic = smoothstep(0.58, 0.98, waveA * 0.7 + waveB * 0.55);

      vec3 base = vec3(0.02, 0.25, 0.62);
      vec3 glow = vec3(0.24, 0.74, 1.0);
      vec3 color = mix(base, glow, caustic);

      float vignette = smoothstep(1.35, 0.22, length(p * vec2(0.9, 1.1)));
      float alpha = (0.08 + caustic * 0.28) * vignette;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width === width && canvas.height === height) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  };

  let rafId = null;
  let isVisible = true;
  const startTime = performance.now();

  const renderFrame = (now) => {
    rafId = null;

    if (!isVisible) {
      return;
    }

    resize();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(timeLocation, (now - startTime) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(renderFrame);
  };

  const requestFrame = () => {
    if (rafId === null) {
      rafId = requestAnimationFrame(renderFrame);
    }
  };

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isVisible = Boolean(entry && entry.isIntersecting);
      if (isVisible) {
        requestFrame();
      }
    },
    { threshold: 0.05 }
  );

  visibilityObserver.observe(heroSection);
  window.addEventListener("resize", resize, { passive: true });

  resize();
  requestFrame();
}

function initMotionDesign() {
  const gsapApi = window.gsap;

  if (!gsapApi || REDUCED_MOTION_QUERY.matches) {
    return;
  }

  gsapApi.from([".eyebrow", ".hero-title-panel", ".hero-copy", ".hero-actions"], {
    opacity: 0,
    y: 24,
    duration: 0.95,
    stagger: 0.1,
    ease: "power3.out",
  });

  gsapApi.from(".metric-chip", {
    opacity: 0,
    y: 18,
    duration: 0.75,
    stagger: 0.08,
    delay: 0.24,
    ease: "power2.out",
  });

  const revealTargets = Array.from(
    document.querySelectorAll(".section .card, .section .kpi-grid, .timeline-card")
  );

  const seen = new WeakSet();
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seen.has(entry.target)) {
          return;
        }

        seen.add(entry.target);
        gsapApi.fromTo(
          entry.target,
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

function initScrollTopButton() {
  const button = refs.scrollTopButton;
  if (!button) return;

  const gsapApi = window.gsap;
  const useGsap = Boolean(gsapApi && !REDUCED_MOTION_QUERY.matches);
  const icon = button.querySelector("svg");
  let isVisible = false;

  if (useGsap) {
    gsapApi.set(button, { autoAlpha: 0, y: 12, scale: 0.94 });
  }

  const setVisible = (nextVisible) => {
    if (nextVisible === isVisible) return;
    isVisible = nextVisible;
    button.classList.toggle("is-visible", nextVisible);

    if (!useGsap) return;

    gsapApi.killTweensOf(button);
    gsapApi.to(button, {
      autoAlpha: nextVisible ? 1 : 0,
      y: nextVisible ? 0 : 12,
      scale: nextVisible ? 1 : 0.94,
      duration: nextVisible ? 0.26 : 0.2,
      ease: nextVisible ? "power2.out" : "power2.in",
    });
  };

  let ticking = false;
  const handleScroll = () => {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY || window.pageYOffset || 0;
      setVisible(y > 520);
      ticking = false;
    });
  };

  button.addEventListener("click", () => {
    if (useGsap) {
      gsapApi.to(button, {
        scale: 0.9,
        duration: 0.09,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
      });

      if (icon) {
        gsapApi.fromTo(
          icon,
          { y: 0 },
          { y: -2, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }
        );
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });
}

const store = createStore({
  sortBy: refs.sortBySelect.value,
  unit: refs.unitModeInput.value,
  realMode: true,
  dailyGoalSteps: 25000,
  daysRemaining: Number(refs.daysRemainingInput.value),
  othersMode: refs.othersModeInput.value,
  todaySteps: Number(refs.todayStepsInput.value),
  blockMorning: Number(refs.blockMorningInput.value),
  blockTreadmill: Number(refs.blockTreadmillInput.value),
  blockEvening: Number(refs.blockEveningInput.value),
  trendDay: Number(refs.trendDayInput.value),
  gapMode: "steps",
});

refs.sortBySelect.addEventListener("change", (event) => {
  store.set({ sortBy: event.target.value });
});

refs.unitModeInput.addEventListener("change", (event) => {
  store.set({ unit: event.target.value });
});

if (refs.realModeToggle) {
  refs.realModeToggle.addEventListener("click", () => {
    const { realMode } = store.get();
    store.set({ realMode: !realMode });
  });
}

refs.dailyGoalInput.addEventListener("input", (event) => {
  const state = store.get();
  const raw = Number(event.target.value);

  if (state.unit === "km") {
    store.set({ dailyGoalSteps: kmToSteps(raw) });
    return;
  }

  store.set({ dailyGoalSteps: raw });
});

refs.dailyGoalNumberInput.addEventListener("input", (event) => {
  const state = store.get();
  const raw = Number(event.target.value);

  if (state.unit === "km") {
    store.set({ dailyGoalSteps: kmToSteps(raw) });
    return;
  }

  store.set({ dailyGoalSteps: raw });
});

refs.daysRemainingInput.addEventListener("input", (event) => {
  const daysRemaining = clamp(Number(event.target.value) || 1, 1, 60);
  store.update((state) => ({
    ...state,
    daysRemaining,
    trendDay: clamp(state.trendDay, 0, daysRemaining),
  }));
});

refs.othersModeInput.addEventListener("change", (event) => {
  store.set({ othersMode: event.target.value });
});

refs.todayStepsInput.addEventListener("input", (event) => {
  const raw = clamp(Number(event.target.value) || 0, 0, 120000);
  store.set({ todaySteps: raw });
});

refs.blockMorningInput.addEventListener("input", (event) => {
  store.set({ blockMorning: Math.max(Number(event.target.value) || 0, 0) });
});

refs.blockTreadmillInput.addEventListener("input", (event) => {
  store.set({ blockTreadmill: Math.max(Number(event.target.value) || 0, 0) });
});

refs.blockEveningInput.addEventListener("input", (event) => {
  store.set({ blockEvening: Math.max(Number(event.target.value) || 0, 0) });
});

refs.trendDayInput.addEventListener("input", (event) => {
  store.set({ trendDay: Number(event.target.value) });
});

refs.gapButtons.forEach((button) => {
  button.addEventListener("click", () => {
    store.set({ gapMode: button.dataset.gapMode });
  });
});

refs.trendChart.addEventListener("pointermove", (event) => {
  const { daysRemaining, trendDay } = store.get();
  const bounds = refs.trendChart.getBoundingClientRect();
  const x = clamp(event.clientX - bounds.left, 0, bounds.width);
  const nextDay = Math.round((x / bounds.width) * daysRemaining);

  if (nextDay !== trendDay) {
    store.set({ trendDay: nextDay });
  }
});

store.subscribe(renderApp);
initScrollTopButton();
initHeroVideo();
initHeroShader();
initMotionDesign();
