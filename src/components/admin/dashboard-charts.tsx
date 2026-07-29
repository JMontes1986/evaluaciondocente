"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TeacherAverageChart({ data }: { data: { name: string; average: number }[] }) {
  if (!data.length) return <div className="grid h-72 place-items-center rounded-lg border border-dashed text-sm text-muted-foreground">No hay resultados para graficar.</div>;
  return <div className="h-72 w-full" aria-label="Promedio general por docente"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: -20, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={.35} /><XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis domain={[0,4]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "var(--secondary)" }} /><Bar dataKey="average" name="Promedio" fill="var(--primary)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div>;
}
