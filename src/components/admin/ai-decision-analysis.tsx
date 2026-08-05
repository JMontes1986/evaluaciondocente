"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, RefreshCw, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { groqModelLabel } from "@/lib/ai/groq-models";

interface AiDecisionAnalysisProps {
  configured: boolean;
  canAnalyze: boolean;
  periodId?: string;
  teacherId?: string;
  gradeId?: string;
  model: string;
}

export function AiDecisionAnalysis({
  configured,
  canAnalyze,
  periodId,
  teacherId,
  gradeId,
  model
}: AiDecisionAnalysisProps) {
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(model);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const generateAnalysis = useCallback(async () => {
    controllerRef.current?.abort();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setAnalysis("");
    setError("");
    setLoading(true);
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch("/api/ai/dashboard-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId, teacherId, gradeId }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null) as {
        analysis?: string;
        error?: string;
        model?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "No fue posible generar el an\u00e1lisis.");
      }
      const generatedAnalysis = payload?.analysis?.trim();
      if (!generatedAnalysis) {
        throw new Error("Groq termin\u00f3 la solicitud sin devolver un an\u00e1lisis.");
      }
      if (requestIdRef.current === requestId) {
        setAnalysis(generatedAnalysis);
        if (payload?.model) setActiveModel(payload.model);
      }
    } catch (caught) {
      if (requestIdRef.current === requestId) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          setError("La generación fue cancelada.");
        } else {
          setError(caught instanceof Error ? caught.message : "No fue posible generar el análisis.");
        }
      }
    } finally {
      if (requestIdRef.current === requestId) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, [gradeId, periodId, teacherId]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-primary/20 bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-primary/[.04] p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="size-5 text-primary" />Análisis asistido con Groq
            {configured && canAnalyze && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />En vivo
              </span>
            )}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {groqModelLabel(activeModel)} interpreta exclusivamente los indicadores agregados visibles en este dashboard.
          </p>
        </div>
        {loading ? (
          <Button type="button" variant="outline" onClick={() => controllerRef.current?.abort()}>
            <Square className="size-4" />Detener
          </Button>
        ) : (
          <Button type="button" onClick={generateAnalysis} disabled={!configured || !canAnalyze}>
            {analysis ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
            {analysis ? "Generar nuevamente" : "Generar análisis"}
          </Button>
        )}
      </div>

      {!configured && (
        <p className="m-5 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 sm:m-6">
          Configura GROQ_API_KEY en las variables de entorno de Vercel para habilitar esta función.
        </p>
      )}
      {configured && !canAnalyze && (
        <p className="m-5 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-950 sm:m-6">
          El análisis en vivo se activará cuando existan suficientes evaluaciones para respetar el umbral de privacidad.
        </p>
      )}
      {loading && !analysis && (
        <p className="m-5 animate-pulse text-sm text-muted-foreground sm:m-6">Groq está analizando los resultados…</p>
      )}
      {error && <p role="alert" className="m-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:m-6">{error}</p>}
      {analysis && (
        <div className="p-5 sm:p-6">
          <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{analysis}</div>
          <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
            El contenido generado por IA es una recomendación de apoyo y debe validarse con el contexto académico institucional.
          </p>
        </div>
      )}
    </section>
  );
}
