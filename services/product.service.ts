import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { AuditService } from "./audit.service"

export class ProductService {
  static async getAll() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    })
  }

  static async getById(id: number) {
    return prisma.product.findUnique({
      where: { id },
    })
  }

  static async create(data: any, userId: string) {
    try {
      const product = await prisma.product.create({
        data: {
          name: data.name,
          collection: data.collection,
          price: parseInt(data.price),
          image: data.image,
          color: data.color,
          design: data.design,
          descEs: data.descEs || "",
          descEn: data.descEn || "",
        },
      })

      await AuditService.log({
        userId,
        action: "CREATE",
        resource: "Product",
        resourceId: product.id.toString(),
        changes: product,
      })

      logger.info({ productId: product.id }, "Product created successfully")
      return product
    } catch (error) {
      logger.error({ error, data }, "Error in ProductService.create")
      throw error
    }
  }

  static async update(id: number, data: any, userId: string) {
    try {
      const oldProduct = await this.getById(id)
      if (!oldProduct) throw new Error("Product not found")

      const product = await prisma.product.update({
        where: { id },
        data: {
          name: data.name,
          collection: data.collection,
          price: parseInt(data.price),
          image: data.image,
          color: data.color,
          design: data.design,
          descEs: data.descEs || "",
          descEn: data.descEn || "",
        },
      })

      await AuditService.log({
        userId,
        action: "UPDATE",
        resource: "Product",
        resourceId: id.toString(),
        changes: { before: oldProduct, after: product },
      })

      logger.info({ productId: id }, "Product updated successfully")
      return product
    } catch (error) {
      logger.error({ error, productId: id, data }, "Error in ProductService.update")
      throw error
    }
  }

  static async delete(id: number, userId: string) {
    try {
      const product = await this.getById(id)
      if (!product) throw new Error("Product not found")

      await prisma.product.delete({ where: { id } })

      await AuditService.log({
        userId,
        action: "DELETE",
        resource: "Product",
        resourceId: id.toString(),
        changes: product,
      })

      logger.info({ productId: id }, "Product deleted successfully")
      return true
    } catch (error) {
      logger.error({ error, productId: id }, "Error in ProductService.delete")
      throw error
    }
  }
}
