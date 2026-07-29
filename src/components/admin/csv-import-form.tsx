"use client";

import { useActionState } from "react";
import type { CsvImportAction, CsvImportState } from "@/actions/csv-imports";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Button } from "@/components/ui/button";

const initialState: CsvImportState = { status: "idle", message: "" };

interface CsvImportFormProps {
  action: CsvImportAction;
  columns: string;
  entityLabel: string;
  inputId: string;
  templateHref: string;
}

export function CsvImportForm({
  action,
  columns,
  entityLabel,
  inputId,
  templateHref
}: CsvImportFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <section className="mb-7 overflow-hidden rounded-xl border bg-card">
      <div className="grid gap-5 border-b p-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Carga masiva CSV</p>
          <h2 className="mt-2 text-lg font-semibold">Importar {entityLabel}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Usa los encabezados <span className="font-mono text-foreground">{columns}</span>. Se aceptan archivos
            separados por coma o punto y coma, con un máximo de 5.000 registros.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={templateHref} download>Descargar plantilla</a>
        </Button>
      </div>

      <form action={formAction} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
        <div className="space-y-2">
          <label htmlFor={inputId} className="block text-sm font-semibold">Archivo CSV</label>
          <input
            id={inputId}
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="block min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:font-semibold file:text-secondary-foreground"
          />
          <p className="text-xs text-muted-foreground">Tamaño máximo: 8 MB. La primera fila debe contener los encabezados.</p>
        </div>
        <FormSubmitButton pendingLabel="Validando archivo…">Validar e importar</FormSubmitButton>
      </form>

      {state.status !== "idle" && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`border-t px-5 py-4 text-sm ${
            state.status === "error"
              ? "border-destructive/25 bg-destructive/5 text-destructive"
              : "border-emerald-700/20 bg-emerald-700/5 text-emerald-800"
          }`}
        >
          <p className="font-semibold">{state.message}</p>
          {state.errors?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  );
}
