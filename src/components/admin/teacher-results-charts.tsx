"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TeacherQuestionResult } from "@/lib/services/teacher-results-service";

export function QuestionDistributionChart({ data }: { data: TeacherQuestionResult[] }) {
  if (!data.length) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No hay respuestas suficientes para mostrar esta gráfica.
      </div>
    );
  }

  const height = Math.max(420, data.length * 46);
  return (
    <div style={{ height }} className="w-full" aria-label="Distribución de respuestas por pregunta">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="label" width={44} tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(label) => {
              const question = data.find((item) => item.label === label);
              return question ? `${question.label}: ${question.question}` : label;
            }}
            formatter={(value, name) => [value, name]}
          />
          <Legend />
          <Bar dataKey="never" name="Nunca" stackId="answers" fill="#b42318" />
          <Bar dataKey="sometimes" name="Algunas veces" stackId="answers" fill="#e7892b" />
          <Bar dataKey="almostAlways" name="Casi siempre" stackId="answers" fill="#4f78a8" />
          <Bar dataKey="always" name="Siempre" stackId="answers" fill="#087a63" radius={[0, 5, 5, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
