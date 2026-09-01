export type SecurityMeasureStatus = "active" | "partial" | "verify" | "pending";

export type SecurityMeasureCategory =
  | "Acceso e identidad"
  | "Datos y base de datos"
  | "Aplicación e infraestructura"
  | "Archivos y dependencias"
  | "Servicios externos"
  | "Operación y seguimiento";

export interface SecurityMeasure {
  id: string;
  category: SecurityMeasureCategory;
  title: string;
  description: string;
  status: SecurityMeasureStatus;
  evidence: string;
  nextStep?: string;
}

export const SECURITY_STATUS_LABELS: Record<SecurityMeasureStatus, string> = {
  active: "Aplicada",
  partial: "Parcial",
  verify: "Por verificar",
  pending: "Pendiente"
};

export const SECURITY_CATEGORIES: SecurityMeasureCategory[] = [
  "Acceso e identidad",
  "Datos y base de datos",
  "Aplicación e infraestructura",
  "Archivos y dependencias",
  "Servicios externos",
  "Operación y seguimiento"
];

export function getSecurityMeasures({ groqConfigured }: { groqConfigured: boolean }): SecurityMeasure[] {
  return [
    {
      id: "admin-auth",
      category: "Acceso e identidad",
      title: "Autenticación administrativa",
      description: "Cada acceso valida sesión de Supabase, perfil activo, rol institucional y permisos del módulo en el servidor.",
      status: "active",
      evidence: "Control del servidor en permissions.ts y proxy.ts"
    },
    {
      id: "module-authorization",
      category: "Acceso e identidad",
      title: "Autorización por módulos",
      description: "Las cuentas restringidas solo pueden entrar a módulos asignados; las áreas críticas requieren SUPER_ADMIN.",
      status: "active",
      evidence: "requireModule y requireSuperAdmin"
    },
    {
      id: "student-session",
      category: "Acceso e identidad",
      title: "Sesión estudiantil protegida",
      description: "La sesión usa una cookie HttpOnly/SameSite y la base conserva únicamente el hash SHA-256 del token.",
      status: "active",
      evidence: "student-session.ts"
    },
    {
      id: "password-recovery",
      category: "Acceso e identidad",
      title: "Recuperación de contraseña PKCE",
      description: "El cambio exige callback PKCE reciente y marcador HttpOnly firmado, ligado al usuario, de diez minutos y consumo único.",
      status: "active",
      evidence: "auth/callback y password-recovery.ts"
    },
    {
      id: "secure-password-change",
      category: "Acceso e identidad",
      title: "Secure password change",
      description: "El código vuelve a comprobar la contraseña actual, pero la opción administrada por Supabase debe confirmarse en producción.",
      status: "verify",
      evidence: "Configuración externa de Supabase Auth",
      nextStep: "Confirmar en Authentication > Providers > Email que Secure password change esté activo."
    },
    {
      id: "admin-mfa",
      category: "Acceso e identidad",
      title: "MFA para cuentas administrativas",
      description: "La autenticación multifactor todavía no está exigida por la aplicación para cuentas administrativas.",
      status: "pending",
      evidence: "Pendiente de Supabase Auth y política institucional",
      nextStep: "Configurar MFA y exigirlo al menos para SUPER_ADMIN."
    },
    {
      id: "rls",
      category: "Datos y base de datos",
      title: "Row Level Security",
      description: "Las migraciones habilitan RLS y definen políticas sin acceso general USING (true) sobre información sensible.",
      status: "verify",
      evidence: "Migraciones 001, 002 y 009",
      nextStep: "Verificar que todas las migraciones estén aplicadas en el proyecto Supabase de producción."
    },
    {
      id: "service-role",
      category: "Datos y base de datos",
      title: "Clave service_role aislada",
      description: "La credencial privilegiada solo se importa desde módulos server-only y nunca se entrega al navegador.",
      status: "active",
      evidence: "Cliente administrativo server-only"
    },
    {
      id: "evaluation-rpc",
      category: "Datos y base de datos",
      title: "Envío transaccional de evaluaciones",
      description: "La RPC valida estudiante, periodo, asignación, preguntas, rangos y duplicados dentro de una transacción.",
      status: "verify",
      evidence: "Migraciones de endurecimiento SQL",
      nextStep: "Confirmar la versión de la RPC desplegada en producción."
    },
    {
      id: "security-definer",
      category: "Datos y base de datos",
      title: "Funciones privilegiadas restringidas",
      description: "Las funciones SECURITY DEFINER de informes se limitan a service_role desde el servidor.",
      status: "verify",
      evidence: "Migración 009_security_hardening.sql",
      nextStep: "Auditar privilegios EXECUTE después de cada migración."
    },
    {
      id: "privacy-threshold",
      category: "Datos y base de datos",
      title: "Umbral de confidencialidad",
      description: "Los resultados segmentados y reportes docentes solo aparecen al alcanzar el mínimo institucional de respuestas.",
      status: "active",
      evidence: "Configuración minResponses y servicios analíticos"
    },
    {
      id: "public-report-links",
      category: "Datos y base de datos",
      title: "Enlaces públicos de informes",
      description: "Los tokens se validan, las respuestas no se indexan y el contenido no se almacena en caché.",
      status: "active",
      evidence: "Ruta reporte/docente y cabeceras no-store"
    },
    {
      id: "csp",
      category: "Aplicación e infraestructura",
      title: "CSP estricta para scripts",
      description: "Cada solicitud genera un nonce criptográfico; script-src usa nonce y strict-dynamic sin unsafe-inline en producción.",
      status: "active",
      evidence: "csp.ts, proxy.ts y prueba HTTP de nonces"
    },
    {
      id: "csp-styles",
      category: "Aplicación e infraestructura",
      title: "CSP para estilos",
      description: "style-src todavía conserva unsafe-inline por compatibilidad con componentes de interfaz.",
      status: "partial",
      evidence: "Política CSP actual",
      nextStep: "Inventariar estilos inline y migrar gradualmente a nonce o CSS externo."
    },
    {
      id: "security-headers",
      category: "Aplicación e infraestructura",
      title: "Cabeceras HTTP defensivas",
      description: "Se publican HSTS, nosniff, frame protection, políticas de permisos, referrer y aislamiento de origen.",
      status: "active",
      evidence: "next.config.ts"
    },
    {
      id: "sensitive-no-store",
      category: "Aplicación e infraestructura",
      title: "Contenido sensible sin caché",
      description: "Administración, sesiones estudiantiles, exportaciones y reportes por token usan Cache-Control no-store.",
      status: "active",
      evidence: "Cabeceras de rutas sensibles"
    },
    {
      id: "public-errors",
      category: "Aplicación e infraestructura",
      title: "Errores públicos neutralizados",
      description: "Las respuestas públicas evitan revelar existencia de códigos, credenciales, detalles SQL y errores internos.",
      status: "active",
      evidence: "Acciones y route handlers"
    },
    {
      id: "postgrest-filters",
      category: "Aplicación e infraestructura",
      title: "Filtros PostgREST saneados",
      description: "Los valores que entran en expresiones .or() pasan por caracteres permitidos antes de construir la consulta.",
      status: "active",
      evidence: "query.ts y pruebas automatizadas"
    },
    {
      id: "rate-limits",
      category: "Aplicación e infraestructura",
      title: "Límites de intentos",
      description: "Login, recuperación de contraseña y análisis con IA tienen rate limiting, pero el almacenamiento actual vive en cada instancia.",
      status: "partial",
      evidence: "rate-limit.ts",
      nextStep: "Conectar el limitador a almacenamiento distribuido o al firewall de la plataforma."
    },
    {
      id: "xlsx-bombs",
      category: "Archivos y dependencias",
      title: "Protección contra ZIP bombs XLSX",
      description: "Antes de ExcelJS se limitan tamaño comprimido, contenido real descomprimido, entradas y relación de compresión.",
      status: "active",
      evidence: "xlsx-security.ts y pruebas con archivos manipulados"
    },
    {
      id: "spreadsheet-formulas",
      category: "Archivos y dependencias",
      title: "Neutralización de fórmulas",
      description: "Las exportaciones impiden que valores controlados por usuarios se interpreten como fórmulas de hoja de cálculo.",
      status: "active",
      evidence: "Servicios de exportación"
    },
    {
      id: "exceljs-uuid",
      category: "Archivos y dependencias",
      title: "Mitigación de uuid en ExcelJS",
      description: "El lockfile fuerza uuid 11.1.1 para cerrar GHSA-w5hq-g745-h8pq sin reemplazar la última versión disponible de ExcelJS.",
      status: "active",
      evidence: "Override de package.json y lockfile"
    },
    {
      id: "dependency-audit",
      category: "Archivos y dependencias",
      title: "Auditoría de dependencias",
      description: "La última revisión local terminó sin vulnerabilidades de producción, pero debe repetirse en cada despliegue.",
      status: "partial",
      evidence: "npm audit --omit=dev ejecutado durante el endurecimiento",
      nextStep: "Agregar npm audit o una herramienta equivalente al CI."
    },
    {
      id: "groq-access",
      category: "Servicios externos",
      title: "Acceso directivo al análisis con IA",
      description: "El endpoint de Groq solo admite SUPER_ADMIN, ADMIN, RECTOR, DIRECTIVO y COORDINADOR.",
      status: "active",
      evidence: "Validación de rol en dashboard-analysis y teacher-analysis"
    },
    {
      id: "groq-pseudonymization",
      category: "Servicios externos",
      title: "Seudonimización antes de Groq",
      description: "Los nombres docentes se sustituyen por alias efímeros y no se envían UUID, correos, comentarios ni identidades estudiantiles.",
      status: "active",
      evidence: "dashboard-analysis-prompt.ts y teacher-analysis-prompt.ts"
    },
    {
      id: "groq-secret",
      category: "Servicios externos",
      title: "Credencial de Groq",
      description: groqConfigured
        ? "La integración está habilitada mediante un secreto exclusivo del servidor; su valor no se expone en la interfaz."
        : "La credencial no está configurada y la integración permanece deshabilitada.",
      status: "active",
      evidence: groqConfigured ? "GROQ_API_KEY presente en el servidor" : "Función externa deshabilitada de forma segura"
    },
    {
      id: "groq-contract",
      category: "Servicios externos",
      title: "Tratamiento contractual con Groq",
      description: "El envío está documentado, pero la institución debe confirmar ubicación, conservación, eliminación y condiciones del proveedor.",
      status: "verify",
      evidence: "Revisión jurídica y aviso de privacidad",
      nextStep: "Registrar la aprobación institucional y la fecha de la última revisión contractual."
    },
    {
      id: "audit-logs",
      category: "Operación y seguimiento",
      title: "Trazabilidad de eventos",
      description: "Accesos, fallos, cambios, importaciones, exportaciones y eventos de seguridad generan registros con datos sensibles redactados.",
      status: "active",
      evidence: "audit-service.ts y módulo Logs"
    },
    {
      id: "production-migrations",
      category: "Operación y seguimiento",
      title: "Migraciones de seguridad en producción",
      description: "El repositorio contiene las migraciones de endurecimiento, pero este tablero no puede confirmar por sí solo el estado remoto.",
      status: "verify",
      evidence: "Supabase CLI o historial remoto de migraciones",
      nextStep: "Comparar el historial de producción con todas las migraciones del repositorio."
    },
    {
      id: "secret-rotation",
      category: "Operación y seguimiento",
      title: "Rotación de secretos",
      description: "Existe una instrucción de rotación ante sospecha de exposición, pero no se registra aquí la fecha de última rotación.",
      status: "verify",
      evidence: "Gestor de secretos de la plataforma",
      nextStep: "Definir periodicidad y conservar evidencia de rotación sin almacenar los valores."
    }
  ];
}
