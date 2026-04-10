import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { AuditService } from "./audit.service"

export class ConfigService {
  static async get() {
    let config = await prisma.config.findUnique({
      where: { id: "singleton" },
    })

    if (!config) {
      config = await prisma.config.create({
        data: { id: "singleton" },
      })
      logger.info("Config singleton created")
    }

    return config
  }

  static async update(data: any, userId: string, userEmail: string) {
    try {
      const oldConfig = await this.get()

      const config = await prisma.config.update({
        where: { id: "singleton" },
        data: {
          siteName: data.siteName,
          whatsappNumber: data.whatsappNumber,
          currency: data.currency,
          heroTitle1: data.heroTitle1,
          heroTitle2: data.heroTitle2,
          heroSubtitle: data.heroSubtitle,
          primaryColor: data.primaryColor,
          backgroundColor: data.backgroundColor,
          updatedBy: userEmail,
        },
      })

      await AuditService.log({
        userId,
        action: "UPDATE",
        resource: "Config",
        resourceId: "singleton",
        changes: { before: oldConfig, after: config },
      })

      logger.info({ userId }, "Config updated successfully")
      return config
    } catch (error) {
      logger.error({ error, userId }, "Error in ConfigService.update")
      throw error
    }
  }
}
