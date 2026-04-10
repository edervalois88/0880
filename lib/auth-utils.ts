import { auth } from "@/auth"
import { NextRequest } from "next/server"

/**
 * Ensures the requesting user has the 'admin' role.
 * Returns the session if authorized, otherwise null.
 */
export async function ensureAdmin(request?: NextRequest) {
  const session = await auth()
  
  if (!session?.user || (session.user as any).role !== "admin") {
    return null
  }
  
  return session
}
