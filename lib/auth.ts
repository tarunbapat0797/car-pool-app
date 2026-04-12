import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'token'
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

export interface JWTPayload {
  userId: string
  email: string
  name: string
  phone: string
  role: 'user' | 'admin'
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE_SECONDS })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

/** Read and verify the auth cookie. Returns null if missing or invalid. */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

/** Call inside a Route Handler to set the auth cookie. */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE_SECONDS,
    path: '/',
  })
}

/** Call inside a Route Handler to clear the auth cookie. */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export { COOKIE_NAME }
