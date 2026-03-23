import { prisma } from './lib/prisma'
const path = require('path')

async function main() {
  console.log('🚀 Iniciando migración de productos desde constants.js...')
  try {
    // Importación dinámica del archivo de constantes
    const constantsPath = path.resolve(process.cwd(), 'app/data/constants.js')
    const { productsData } = require(constantsPath)

    console.log(`📦 Encontrados ${productsData.length} productos en constants.js.`)

    // Limpiar productos existentes en la nueva DB
    await prisma.product.deleteMany()
    console.log('🗑️ Base de datos limpiada.')

    // Insertar productos
    let count = 0
    for (const p of productsData) {
      await prisma.product.create({
        data: {
          name: p.name,
          collection: p.collection,
          price: p.price,
          image: p.image,
          color: p.color,
          design: p.design,
          descEs: p.desc?.es || '',
          descEn: p.desc?.en || '',
        },
      })
      count++
    }

    // Log de auditoría (opcional en script, pero bueno para consistencia)
    // Buscamos el admin que creamos en el seed
    const admin = await prisma.user.findUnique({ where: { email: 'admin@0880.mx' } })
    if (admin) {
        await prisma.auditLog.create({
          data: {
            userId: admin.id,
            action: 'CREATE',
            resource: 'Product',
            resourceId: 'MIGRATION_SCRIPT',
            changes: JSON.stringify({ count }),
          },
        })
    }

    console.log('✅ Migración completada con éxito!')
    console.log('📦 Total productos migrados:', count)
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

main()
  .finally(() => prisma.$disconnect())
