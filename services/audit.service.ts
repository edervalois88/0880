import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export type AuditAction = "CREATE" | "UPDATE" | "DELETE"

export class AuditService {
  static async log({
    userId,
    action,
    resource,
    resourceId,
    changes,
  }: {
    userId: string
    action: AuditAction
    resource: string
    resourceId: string
    changes: any
  }) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          changes: typeof changes === "string" ? changes : JSON.stringify(changes),
        },
      })
      
      logger.info({ action, resource, resourceId }, "Audit log created")
      return log
    } catch (error) {
      logger.error({ error, action, resource, resourceId }, "Failed to create audit log")
      // We don't throw here to avoid failing the main operation if audit fails
      return null
    }
  }
}
