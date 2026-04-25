import { motion } from "framer-motion";
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

const BEST_COLOR = "#8e9b7d";
const DEFAULT_BAR_COLOR = "#c7a974";
const LINE_COLOR = "#7fd0bd";
const HIT_COLOR = "#c8d6ec";
const surfaceClass =
  "premium-surface rounded-2xl border backdrop-blur";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="premium-subsurface-soft rounded-xl px-3 py-2 text-xs text-slate-100 shadow-xl">
      <div className="mb-1 font-semibold text-slate-50">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-premium-muted">
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
    <section className={`${surfaceClass} p-5`}>
      <div>
        <p className="text-xs text-premium-muted">Analytics</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-50">
          Fault Patterns and Algorithm Trends
        </h2>
      </div>

      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 text-sm font-semibold text-slate-200">
            Page Faults vs Algorithms
          </div>
          <div className="premium-subsurface-soft h-[280px] rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="algorithm"
                  tick={{ fill: "#cad5e5", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8c9aad", fontSize: 12 }}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <div className="mb-4 text-sm font-semibold text-slate-200">
            Step vs Fault Accumulation
          </div>
          <div className="premium-subsurface-soft h-[280px] rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timelineData}
                margin={{ top: 8, right: 8, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.07)"
                  vertical={false}
                />
                <XAxis
                  dataKey="step"
                  tick={{ fill: "#cad5e5", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8c9aad", fontSize: 12 }}
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
        </motion.div>
      </div>
    </section>
  );
}

export default Charts;
