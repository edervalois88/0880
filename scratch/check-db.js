const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- DIAGNOSTIC DATA ---');
    
    const users = await prisma.user.findMany();
    console.log('USERS:', JSON.stringify(users, null, 2));
    
    const config = await prisma.config.findUnique({
      where: { id: 'singleton' }
    });
    console.log('CONFIG:', JSON.stringify(config, null, 2));
    
    const productsCount = await prisma.product.count();
    console.log('PRODUCTS COUNT:', productsCount);
    
    const ordersCount = await prisma.order.count();
    console.log('ORDERS COUNT:', ordersCount);

  } catch (error) {
    console.error('Error during diagnostics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
