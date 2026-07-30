import { z } from "zod";
import { commentModerationRateLimiter } from "@/lib/security/rate-limit";
import { getStudentSession } from "@/lib/security/student-session";
import { moderateEvaluationComment } from "@/lib/services/comment-moderation-service";

const requestSchema = z.object({
  comment: z.string().trim().max(2000)
});

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session) {
    return Response.json(
      { error: "La sesión venció. Ingresa nuevamente." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = await commentModerationRateLimiter.check(`live:${session.student_id}`);
  if (!rateLimit.allowed) {
    return Response.json(
      { error: `Espera ${rateLimit.retryAfterSeconds} segundos antes de revisar nuevamente.` },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "El comentario no es válido." }, { status: 400 });
  }

  const result = await moderateEvaluationComment(parsed.data.comment);
  return Response.json(result, {
    headers: {
      "Cache-Control": "no-cache, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
