import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BEST_COLOR = "#22c55e";
const DEFAULT_BAR_COLOR = "#f97316";
const LINE_COLOR = "#22d3ee";
const HIT_COLOR = "#34d399";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-white/10 bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow-xl">
      <div className="mb-1 font-semibold text-cyan-100">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">
            {entry.name}: {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Charts({ result, comparison }) {
  if (!result || !comparison) {
    return null;
  }

  const comparisonData = comparison.results.map((entry) => ({
    algorithm: entry.algorithm,
    faults: entry.pageFaults,
    hitRate: Number((entry.hitRate * 100).toFixed(1)),
    best: comparison.bestAlgorithms.includes(entry.algorithm),
  }));

  const timelineData = result.history.map((step) => ({
    step: step.step,
    faults: step.faultCount,
    hits: step.hitCount,
    page: step.currentPage,
  }));

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
          Analytics
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Fault Patterns and Algorithm Trends
        </h2>
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <div>
          <div className="mb-4 text-sm font-semibold text-slate-200">
            Page Faults vs Algorithms
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis
                  dataKey="algorithm"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="faults" name="Faults" radius={[6, 6, 0, 0]}>
                  {comparisonData.map((entry) => (
                    <Cell
                      key={entry.algorithm}
                      fill={entry.best ? BEST_COLOR : DEFAULT_BAR_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold text-slate-200">
            Step vs Fault Accumulation
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis
                  dataKey="step"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="faults"
                  name="Faults"
                  stroke={LINE_COLOR}
                  strokeWidth={3}
                  dot={{ fill: LINE_COLOR, r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="hits"
                  name="Hits"
                  stroke={HIT_COLOR}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Charts;
