import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@0880.mx' },
    update: {},
    create: {
      email: 'admin@0880.mx',
      password: hashedPassword,
      role: 'admin',
      active: true,
    },
  })

  console.log('✅ Admin user created:', adminUser.email)

  // Create default config
  const config = await prisma.config.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteName: '0880 LUXURY COLLECTION',
      whatsappNumber: '+5215512345678',
      currency: 'MXN',
      heroTitle1: 'Handcrafted Luxury',
      heroTitle2: 'Handbags',
      heroSubtitle: 'Elevate your style with our exclusive collection',
      primaryColor: '#1a1a1a',
      backgroundColor: '#f5f5f5',
    },
  })

  console.log('✅ Default config created')

  console.log('✨ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
