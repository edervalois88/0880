import { auth } from "@/auth"
import { NextRequest } from "next/server"

export async function ensureAdmin(request?: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "admin") {
    return null
  }
  return session
}

export async function ensureEditorOrAdmin(request?: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== "admin" && role !== "editor")) {
    return null
  }
  return session
}
