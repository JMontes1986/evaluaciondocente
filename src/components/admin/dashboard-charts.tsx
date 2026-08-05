"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  type PieLabelRenderProps,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { scorePercentage } from "@/lib/calculations/scores";
import type {
  AverageDatum,
  HeatmapDatum,
  QuestionDatum,
  ScatterDatum
} from "@/lib/services/analytics-service";

const pieColors = ["#b42318", "#e7892b", "#4f78a8", "#087a63"];

function formatChartPercentage(value: number) {
  return `${value.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })} %`;
}

function renderPercentagePieLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  value
}: PieLabelRenderProps) {
  const radius = Number(outerRadius) + 16;
  const radians = (-Number(midAngle) * Math.PI) / 180;
  const x = Number(cx) + radius * Math.cos(radians);
  const y = Number(cy) + radius * Math.sin(radians);

  return (
    <text
      x={x}
      y={y}
      className="fill-foreground text-[11px] font-bold"
      textAnchor={x > Number(cx) ? "start" : "end"}
      dominantBaseline="central"
    >
      {formatChartPercentage(Number(value))}
    </text>
  );
}

type PerformancePoint = ScatterDatum & {
  percentage: number;
  displayLabel: string;
};

function performanceColor(percentage: number) {
  if (percentage < 62.5) return "#b42318";
  if (percentage < 80) return "#e7892b";
  return "#087a63";
}

function PerformanceTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as PerformancePoint | undefined;
  if (!active || !point) return null;

  return (
    <div className="max-w-72 rounded-lg border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{point.teacher}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Grado {point.grade}</p>
      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t pt-3">
        <dt className="text-muted-foreground">Resultado</dt>
        <dd className="font-mono font-bold text-foreground">{formatChartPercentage(point.percentage)}</dd>
        <dt className="text-muted-foreground">Evaluaciones</dt>
        <dd className="font-mono font-bold text-foreground">{point.responses}</dd>
      </dl>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="grid h-64 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
      No hay suficientes respuestas para mostrar esta gráfica.
    </div>
  );
}

export function AverageBarChart({
  data,
  ariaLabel
}: {
  data: AverageDatum[];
  ariaLabel: string;
}) {
  if (!data.length) return <EmptyChart />;
  const height = Math.max(280, data.length * 42);
  const chartData = data.map((item) => ({
    ...item,
    percentage: scorePercentage(item.average)
  }));

  return (
    <div style={{ height }} className="w-full" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 28 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [formatChartPercentage(Number(value)), "Promedio"]}
          />
          <Bar dataKey="percentage" name="Promedio" fill="var(--primary)" radius={[0, 6, 6, 0]}>
            <LabelList
              dataKey="percentage"
              position="insideRight"
              fill="#ffffff"
              fontSize={11}
              fontWeight={700}
              formatter={(value) => formatChartPercentage(Number(value))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuestionAverageChart({ data }: { data: QuestionDatum[] }) {
  if (!data.length) return <EmptyChart />;
  const height = Math.max(420, data.length * 34);
  const chartData = data.map((item) => ({
    ...item,
    percentage: scorePercentage(item.average)
  }));

  return (
    <div style={{ height }} className="w-full" aria-label="Promedio porcentual por pregunta">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 28 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11 }}
          />
          <YAxis type="category" dataKey="label" width={42} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`,
              "Promedio"
            ]}
            labelFormatter={(label) => {
              const question = chartData.find((item) => item.label === label);
              return question ? `${question.label}: ${question.question}` : label;
            }}
          />
          <Bar dataKey="percentage" name="Promedio" radius={[0, 5, 5, 0]}>
            {chartData.map((item) => (
              <Cell
                key={item.id}
                fill={item.average < 2.5 ? "#b42318" : item.average < 3.2 ? "#e7892b" : "#087a63"}
              />
            ))}
            <LabelList
              dataKey="percentage"
              position="insideRight"
              fill="#ffffff"
              fontSize={11}
              fontWeight={700}
              formatter={(value) => formatChartPercentage(Number(value))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreDistributionChart({
  data,
  valueMode = "count"
}: {
  data: { name: string; score: number; count: number }[];
  valueMode?: "count" | "percentage";
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <EmptyChart />;
  const chartData = data.map((item) => ({
    ...item,
    percentage: (item.count / total) * 100
  }));
  const dataKey = valueMode === "percentage" ? "percentage" : "count";

  return (
    <div className="h-80 w-full" aria-label={"Distribuci\u00f3n de respuestas"}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey={dataKey}
            nameKey="name"
            innerRadius={62}
            outerRadius={94}
            paddingAngle={2}
            label={valueMode === "percentage" ? renderPercentagePieLabel : false}
            labelLine={valueMode === "percentage"}
          >
            {chartData.map((item, index) => <Cell key={item.score} fill={pieColors[index]} />)}
          </Pie>
          <Tooltip
            formatter={(value) => valueMode === "percentage"
              ? [`${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`, "Porcentaje"]
              : [value, "Respuestas"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PerformanceScatterChart({ data }: { data: ScatterDatum[] }) {
  if (!data.length) return <EmptyChart />;

  const percentages = data.map((item) => scorePercentage(item.average));
  const minimum = Math.min(...percentages);
  const maximum = Math.max(...percentages);
  const pointAverage = percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
  const minimumIndex = percentages.indexOf(minimum);
  const maximumIndex = percentages.indexOf(maximum);
  const chartData: PerformancePoint[] = data.map((item, index) => {
    const percentage = percentages[index];
    return {
      ...item,
      percentage,
      displayLabel: index === minimumIndex || index === maximumIndex
        ? formatChartPercentage(percentage)
        : ""
    };
  });

  return (
    <div className="w-full" aria-label="Dispersión porcentual de desempeño por docente y grado">
      <div className="mb-4 grid overflow-hidden rounded-lg border bg-secondary/20 sm:grid-cols-3 sm:divide-x">
        <div className="border-b px-4 py-3 sm:border-b-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado menor</p>
          <p className="mt-1 font-mono text-lg font-bold text-foreground">{formatChartPercentage(minimum)}</p>
        </div>
        <div className="border-b px-4 py-3 sm:border-b-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Promedio entre cruces</p>
          <p className="mt-1 font-mono text-lg font-bold text-foreground">{formatChartPercentage(pointAverage)}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resultado mayor</p>
          <p className="mt-1 font-mono text-lg font-bold text-foreground">{formatChartPercentage(maximum)}</p>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#b42318]" />Prioridad: menos de 62,5 %</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#e7892b]" />Seguimiento: 62,5–79,9 %</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#087a63]" />Fortaleza: 80 % o más</span>
      </div>

      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ left: 12, right: 24, top: 24, bottom: 22 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
            <XAxis
              type="number"
              dataKey="responses"
              name="Evaluaciones"
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              height={48}
              label={{ value: "Evaluaciones recibidas", position: "insideBottom", offset: -8 }}
            />
            <YAxis
              type="number"
              dataKey="percentage"
              name="Resultado"
              domain={[25, 100]}
              ticks={[25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11 }}
              width={62}
              label={{ value: "Resultado (%)", angle: -90, position: "insideLeft" }}
            />
            <ZAxis type="number" dataKey="responses" range={[55, 220]} />
            <ReferenceLine y={62.5} stroke="#b42318" strokeDasharray="4 4" opacity={0.55} />
            <ReferenceLine y={80} stroke="#087a63" strokeDasharray="4 4" opacity={0.55} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={PerformanceTooltip} />
            <Scatter name="Docente y grado" data={chartData}>
              {chartData.map((item, index) => (
                <Cell key={`${item.name}-${index}`} fill={performanceColor(item.percentage)} />
              ))}
              <LabelList dataKey="displayLabel" position="top" fill="currentColor" fontSize={10} fontWeight={700} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function heatColor(value: number) {
  if (value >= 3.5) return "bg-emerald-700 text-white";
  if (value >= 3) return "bg-emerald-100 text-emerald-900";
  if (value >= 2.5) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
}

function HeatmapScore({
  average,
  responses,
  emphasized = false
}: {
  average: number;
  responses: number;
  emphasized?: boolean;
}) {
  const percentage = scorePercentage(average).toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  return (
    <span
      title={`${responses} evaluaciones · ${percentage} % · Promedio ${average} / 4`}
      className={`block min-w-24 rounded-md px-2 py-2 font-mono ${heatColor(average)} ${emphasized ? "ring-1 ring-inset ring-current/20" : ""}`}
    >
      <span className="block text-sm font-bold leading-none">{percentage} %</span>
      <span className="mt-1 block text-[10px] font-semibold leading-none opacity-75">{average} / 4</span>
    </span>
  );
}

export function TeacherGradeHeatmap({
  data,
  grades
}: {
  data: HeatmapDatum[];
  grades: { id: string; name: string }[];
}) {
  if (!data.length || !grades.length) return <EmptyChart />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs uppercase text-muted-foreground">Docente</th>
            {grades.map((grade) => (
              <th key={grade.id} className="p-2 text-center text-xs uppercase text-muted-foreground">
                {grade.name}
              </th>
            ))}
            <th className="border-l border-border p-2 pl-3 text-center text-xs uppercase text-muted-foreground">
              Total docente
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((teacher) => (
            <tr key={teacher.teacherId}>
              <th className="max-w-52 truncate p-2 text-left font-medium">{teacher.teacher}</th>
              {grades.map((grade) => {
                const cell = teacher.grades[grade.id];
                return (
                  <td key={grade.id} className="p-0.5 text-center">
                    {cell ? (
                      <HeatmapScore average={cell.average} responses={cell.responses} />
                    ) : (
                      <span className="block min-w-24 rounded-md bg-secondary/50 px-2 py-4 text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
              <td className="border-l border-border p-0.5 pl-2 text-center">
                <HeatmapScore
                  average={teacher.total.average}
                  responses={teacher.total.responses}
                  emphasized
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
