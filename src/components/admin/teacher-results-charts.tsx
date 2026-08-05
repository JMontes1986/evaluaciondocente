"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TeacherQuestionResult } from "@/lib/services/teacher-results-service";

function responsePercentage(count: number, total: number) {
  return total ? (count / total) * 100 : 0;
}

function formatPercentage(value: number) {
  return `${value.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })} %`;
}

export function QuestionDistributionChart({ data }: { data: TeacherQuestionResult[] }) {
  if (!data.length) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No hay respuestas suficientes para mostrar esta gráfica.
      </div>
    );
  }

  const height = Math.max(420, data.length * 46);
  const chartData = data.map((question) => ({
    ...question,
    neverPercentage: responsePercentage(question.never, question.responses),
    sometimesPercentage: responsePercentage(question.sometimes, question.responses),
    almostAlwaysPercentage: responsePercentage(question.almostAlways, question.responses),
    alwaysPercentage: responsePercentage(question.always, question.responses)
  }));

  return (
    <div style={{ height }} className="w-full" aria-label="Distribución porcentual de respuestas por pregunta">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={44} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(label) => {
              const question = chartData.find((item) => item.label === label);
              return question ? `${question.label}: ${question.question}` : label;
            }}
            formatter={(value, name) => [formatPercentage(Number(value)), name]}
          />
          <Legend />
          <Bar dataKey="neverPercentage" name="Nunca" stackId="answers" fill="#b42318">
            <LabelList dataKey="neverPercentage" position="center" fill="#ffffff" fontSize={10} fontWeight={700} formatter={(value) => formatPercentage(Number(value))} />
          </Bar>
          <Bar dataKey="sometimesPercentage" name="Algunas veces" stackId="answers" fill="#e7892b">
            <LabelList dataKey="sometimesPercentage" position="center" fill="#ffffff" fontSize={10} fontWeight={700} formatter={(value) => formatPercentage(Number(value))} />
          </Bar>
          <Bar dataKey="almostAlwaysPercentage" name="Casi siempre" stackId="answers" fill="#4f78a8">
            <LabelList dataKey="almostAlwaysPercentage" position="center" fill="#ffffff" fontSize={10} fontWeight={700} formatter={(value) => formatPercentage(Number(value))} />
          </Bar>
          <Bar dataKey="alwaysPercentage" name="Siempre" stackId="answers" fill="#087a63" radius={[0, 5, 5, 0]}>
            <LabelList dataKey="alwaysPercentage" position="center" fill="#ffffff" fontSize={10} fontWeight={700} formatter={(value) => formatPercentage(Number(value))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
