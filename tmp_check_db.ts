import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const productCount = await prisma.product.count()
  const products = await prisma.product.findMany()
  console.log('Product count:', productCount)
  console.log('Products:', JSON.stringify(products, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
