"use client";

import { useActionState } from "react";
import {
  createRestrictedUserAction,
  updateRestrictedUserAction,
  type RestrictedUser,
  type UserAccessState
} from "@/actions/user-access";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ADMIN_MODULES, type AdminModuleKey } from "@/lib/auth/modules";

const initialState: UserAccessState = { status: "idle", message: "" };

export function UserAccessManager({ users }: { users: RestrictedUser[] }) {
  const [state, formAction] = useActionState(createRestrictedUserAction, initialState);

  return (
    <section className="mt-8 overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Solo SUPER_ADMIN</p>
            <h2 className="mt-2 text-xl font-semibold">Usuarios con acceso limitado</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Crea cuentas directivas o de consulta docente y define los módulos disponibles.
            </p>
          </div>
          <Badge>{users.length} cuentas limitadas</Badge>
        </div>
      </div>

      <form action={formAction} className="border-b p-5 sm:p-6">
        <h3 className="font-semibold">Crear cuenta</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Nombre completo" htmlFor="restricted-full-name">
            <Input id="restricted-full-name" name="fullName" required minLength={3} maxLength={180} />
          </Field>
          <Field label="Correo institucional" htmlFor="restricted-email">
            <Input id="restricted-email" name="email" type="email" required autoComplete="off" />
          </Field>
          <Field label="Rol institucional" htmlFor="restricted-role">
            <select id="restricted-role" name="role" required defaultValue="DOCENTE" className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="DOCENTE">Docente (solo resultados)</option>
              <option value="DIRECTIVO">Directivo / Directora académica</option>
              <option value="RECTOR">Rectoría</option>
              <option value="COORDINADOR">Coordinación</option>
            </select>
          </Field>
          <Field label="Contraseña temporal" htmlFor="restricted-password">
            <Input id="restricted-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" />
            <p className="mt-2 text-xs text-muted-foreground">Mínimo 12 caracteres, con mayúscula, minúscula y número.</p>
          </Field>
        </div>

        <ModuleSelector idPrefix="create-user" defaultModules={["dashboard", "resultados_docentes"]} />
        <p className="mt-3 text-xs text-muted-foreground">
          Para el rol Docente, el sistema asigna únicamente Dashboard y Resultados docentes, sin permisos de administración.
        </p>

        {state.status !== "idle" ? <AccessMessage state={state} /> : null}
        <div className="mt-5 max-w-xs"><FormSubmitButton pendingLabel="Creando cuenta…">Crear usuario y asignar acceso</FormSubmitButton></div>
      </form>

      <div className="p-5 sm:p-6">
        <h3 className="font-semibold">Cuentas configuradas</h3>
        <p className="mt-1 text-sm text-muted-foreground">Puedes cambiar sus módulos, rol, nombre o estado.</p>
        {users.length ? (
          <div className="mt-5 divide-y rounded-xl border">
            {users.map((user) => <UserPermissionEditor key={user.id} user={user} />)}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aún no existen cuentas con acceso limitado.
          </p>
        )}
      </div>
    </section>
  );
}

function UserPermissionEditor({ user }: { user: RestrictedUser }) {
  const [state, formAction] = useActionState(updateRestrictedUserAction, initialState);
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold">{user.fullName}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.email} · {user.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{user.active ? "Activo" : "Inactivo"}</Badge>
          <Badge>{user.modules.length} módulos</Badge>
          <span className="text-xs font-semibold text-primary group-open:hidden">Editar</span>
          <span className="hidden text-xs font-semibold text-primary group-open:inline">Cerrar</span>
        </div>
      </summary>
      <form action={formAction} className="border-t bg-secondary/20 p-5">
        <input type="hidden" name="profileId" value={user.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre completo" htmlFor={`name-${user.id}`}>
            <Input id={`name-${user.id}`} name="fullName" required defaultValue={user.fullName} />
          </Field>
          <Field label="Rol institucional" htmlFor={`role-${user.id}`}>
            <select id={`role-${user.id}`} name="role" required defaultValue={user.role} className="min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="DOCENTE">Docente (solo resultados)</option>
              <option value="DIRECTIVO">Directivo / Directora académica</option>
              <option value="RECTOR">Rectoría</option>
              <option value="COORDINADOR">Coordinación</option>
            </select>
          </Field>
        </div>
        <label className="mt-4 inline-flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm font-semibold">
          <input name="active" type="checkbox" defaultChecked={user.active} className="size-4 accent-primary" />
          Cuenta activa
        </label>
        <ModuleSelector idPrefix={user.id} defaultModules={user.modules} />
        {state.status !== "idle" ? <AccessMessage state={state} /> : null}
        <div className="mt-5 max-w-xs"><FormSubmitButton pendingLabel="Guardando acceso…">Guardar permisos</FormSubmitButton></div>
      </form>
    </details>
  );
}

function ModuleSelector({
  idPrefix,
  defaultModules
}: {
  idPrefix: string;
  defaultModules: AdminModuleKey[];
}) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-semibold">Módulos autorizados</legend>
      <p className="mt-1 text-xs text-muted-foreground">Usuarios y Configuración siempre están reservados al SUPER_ADMIN.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {ADMIN_MODULES.map((module) => {
          const id = `${idPrefix}-${module.key}`;
          return (
            <label key={module.key} htmlFor={id} className="flex cursor-pointer gap-3 rounded-lg border bg-background p-4 transition-colors has-checked:border-primary/45 has-checked:bg-primary/[.04]">
              <input
                id={id}
                name="modules"
                type="checkbox"
                value={module.key}
                defaultChecked={defaultModules.includes(module.key)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>
                <span className="block text-sm font-semibold">{module.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{module.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">{label}</label>
      {children}
    </div>
  );
}

function AccessMessage({ state }: { state: UserAccessState }) {
  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`mt-5 rounded-lg border p-3 text-sm ${
        state.status === "error"
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "border-emerald-700/20 bg-emerald-700/5 text-emerald-800"
      }`}
    >
      {state.message}
    </p>
  );
}
