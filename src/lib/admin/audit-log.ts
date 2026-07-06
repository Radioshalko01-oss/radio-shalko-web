import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuditLogInput = {
  actorId: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
};

/**
 * Registra una acción administrativa crítica en admin_audit_log.
 * Usa service_role solo en servidor. No lanza si falla el insert.
 */
export async function logAdminAudit(input: AdminAuditLogInput): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("admin_audit_log").insert({
      actor_id: input.actorId,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entityId ?? null,
      metadata: (input.metadata ?? null) as Record<string, unknown> | null,
      ip: input.ip ?? null,
    });

    if (error) {
      console.error("[admin audit log] insert failed:", error.message, {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    console.error("[admin audit log] unexpected error:", message, {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
    });
  }
}
