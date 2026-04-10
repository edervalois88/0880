import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    // Intenta una operación simple para verificar la conexión con la DB
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      environment: env.NODE_ENV,
      message: "0880 Backend is running correctly",
      stats: {
        users: userCount
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ error }, "Health check failed")
    return NextResponse.json(
      { 
        status: "unhealthy", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        environment: env.NODE_ENV,
      },
      { status: 503 }
    )
  }
}
