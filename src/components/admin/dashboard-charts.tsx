"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import type {
  AverageDatum,
  HeatmapDatum,
  QuestionDatum,
  ScatterDatum
} from "@/lib/services/analytics-service";

const pieColors = ["#b42318", "#e7892b", "#4f78a8", "#087a63"];

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

  return (
    <div style={{ height }} className="w-full" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 28 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis type="number" domain={[1, 4]} tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(value) => [`${value} / 4`, "Promedio"]} />
          <Bar dataKey="average" name="Promedio" fill="var(--primary)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QuestionAverageChart({ data }: { data: QuestionDatum[] }) {
  if (!data.length) return <EmptyChart />;
  const height = Math.max(420, data.length * 34);

  return (
    <div style={{ height }} className="w-full" aria-label="Promedio por pregunta">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 28 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis type="number" domain={[1, 4]} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={42} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`${value} / 4`, "Promedio"]}
            labelFormatter={(label) => {
              const question = data.find((item) => item.label === label);
              return question ? `${question.label}: ${question.question}` : label;
            }}
          />
          <Bar dataKey="average" name="Promedio" radius={[0, 5, 5, 0]}>
            {data.map((item) => (
              <Cell
                key={item.id}
                fill={item.average < 2.5 ? "#b42318" : item.average < 3.2 ? "#e7892b" : "#087a63"}
              />
            ))}
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
            outerRadius={105}
            paddingAngle={2}
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

  return (
    <div className="h-80 w-full" aria-label="Dispersión de desempeño por docente y grado">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
          <XAxis
            type="number"
            dataKey="responses"
            name="Evaluaciones"
            allowDecimals={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="average"
            name="Promedio"
            domain={[1, 4]}
            tick={{ fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="responses" range={[70, 350]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => [name === "Promedio" ? `${value} / 4` : value, name]}
          />
          <Scatter name="Docente y grado" data={data} fill="var(--primary)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function heatColor(value: number) {
  if (value >= 3.5) return "bg-emerald-700 text-white";
  if (value >= 3) return "bg-emerald-100 text-emerald-900";
  if (value >= 2.5) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
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
      <table className="w-full min-w-[760px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left text-xs uppercase text-muted-foreground">Docente</th>
            {grades.map((grade) => (
              <th key={grade.id} className="p-2 text-center text-xs uppercase text-muted-foreground">
                {grade.name}
              </th>
            ))}
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
                      <span
                        title={`${cell.responses} evaluaciones`}
                        className={`block rounded-md px-2 py-3 font-mono font-bold ${heatColor(cell.average)}`}
                      >
                        {cell.average}
                      </span>
                    ) : (
                      <span className="block rounded-md bg-secondary/50 px-2 py-3 text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
